/**
 * v2 volunteer service — cleaner opt-in pool with supervisor approval.
 *
 * Flow:
 *   1. Cleaner browses unassigned pool (`submitted` reports) via
 *      `listAvailableForCleaner` and volunteers via `requestVolunteer`.
 *      This creates a `VolunteerRequestV2` row (status `pending`), a
 *      `volunteer_requested` ReportEventV2, and notifies supervisors.
 *   2. Supervisor sees the queue via `listVolunteerRequests` and either
 *      approves by assigning (existing `assignCleaner`, which auto-marks the
 *      matching request `approved`) or rejects via `rejectVolunteerRequest`.
 *
 * Request rows are the queryable queue; ReportEventV2 rows remain the audit
 * trail consumed by /sync. Follows the conventions in reports.service.ts.
 */
import { Prisma } from '@prisma/client';
import type { ReportV2, VolunteerRequestV2 } from '@prisma/client';

import { pushNotificationsService } from '../../domain/notifications/push-notifications.service';
import { prisma } from '../../infra/prisma';
import { currentTenantId } from '../../infra/tenant-context';
import {
    ReportNotFoundError,
    V2ConflictError,
    V2NotFoundError,
    V2ValidationError
} from '../errors';
import type { V2AuthContext } from '../auth/v2-auth.service';

export type VolunteerRequestStatus = 'pending' | 'approved' | 'rejected';

export interface VolunteerRequestWithRelations extends VolunteerRequestV2 {
    report?: ReportV2 | null;
    cleaner?: { id: string; name: string } | null;
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function tenantId(): string {
    const t = currentTenantId();
    if (!t) throw new V2ValidationError('Tenant scope is not set.');
    return t;
}

async function findSupervisorIds(tx: Tx, excludeUserId?: string): Promise<string[]> {
    const tid = tenantId();
    const v2 = await tx.userRoleV2.findMany({
        where: { tenantId: tid, role: 'supervisor' },
        select: { userId: true }
    });
    const v1 = await tx.userAccount.findMany({
        where: { tenantId: tid, role: 'supervisor' },
        select: { id: true }
    });
    const set = new Set<string>([...v2.map((r) => r.userId), ...v1.map((r) => r.id)]);
    if (excludeUserId) set.delete(excludeUserId);
    return Array.from(set);
}

async function createEvent(
    tx: Tx,
    args: {
        reportId: string;
        eventType: string;
        actorUserId: string | null;
        actorRole: string;
        payload?: Record<string, unknown>;
    }
) {
    return tx.reportEventV2.create({
        data: {
            tenantId: tenantId(),
            reportId: args.reportId,
            eventType: args.eventType,
            actorUserId: args.actorUserId,
            actorRole: args.actorRole,
            payload: (args.payload ?? {}) as Prisma.InputJsonValue
        } as Prisma.ReportEventV2UncheckedCreateInput
    });
}

async function notifyUsers(
    tx: Tx,
    args: { userIds: string[]; reportId: string; eventId: string; title: string; body: string }
): Promise<void> {
    const userIds = Array.from(new Set(args.userIds.filter(Boolean)));
    if (userIds.length === 0) return;
    await tx.notificationV2.createMany({
        data: userIds.map((userId) => ({
            tenantId: tenantId(),
            userId,
            reportId: args.reportId,
            eventId: args.eventId,
            title: args.title,
            body: args.body
        })) as Prisma.NotificationV2UncheckedCreateInput[]
    });
}

// ---- Reads ---------------------------------------------------------------

/**
 * Unassigned pool a cleaner may volunteer for: `submitted` reports only,
 * newest first. Excludes reports the caller already has a pending request for
 * via the `has_pending_request` flag resolved by callers (kept separate so
 * the list stays a plain report query).
 */
export async function listAvailableForCleaner(
    _ctx: V2AuthContext,
    args: { page?: number; limit?: number } = {}
): Promise<{ reports: ReportV2[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, args.page ?? 1);
    const limit = Math.min(100, Math.max(1, args.limit ?? 20));
    const where: Prisma.ReportV2WhereInput = { status: 'submitted' };
    const [reports, total] = await Promise.all([
        prisma.reportV2.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        }),
        prisma.reportV2.count({ where })
    ]);
    return { reports, total, page, limit };
}

/** Pending request ids of the caller, for marking the available pool. */
export async function pendingRequestReportIdsForCleaner(ctx: V2AuthContext): Promise<Set<string>> {
    const rows = await prisma.volunteerRequestV2.findMany({
        where: { cleanerUserId: ctx.userId, status: 'pending' },
        select: { reportId: true }
    });
    return new Set(rows.map((r) => r.reportId));
}

export async function listVolunteerRequests(args: {
    status?: VolunteerRequestStatus;
    page?: number;
    limit?: number;
}): Promise<{ requests: VolunteerRequestWithRelations[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, args.page ?? 1);
    const limit = Math.min(100, Math.max(1, args.limit ?? 20));
    const where: Prisma.VolunteerRequestV2WhereInput = {};
    if (args.status) where.status = args.status;
    const [requests, total] = await Promise.all([
        prisma.volunteerRequestV2.findMany({
            where,
            include: {
                report: true,
                cleaner: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        }),
        prisma.volunteerRequestV2.count({ where })
    ]);
    return { requests, total, page, limit };
}

// ---- Mutations ------------------------------------------------------------

export async function requestVolunteer(
    ctx: V2AuthContext,
    reportId: string,
    args: { note?: string }
): Promise<{ request: VolunteerRequestV2; report: ReportV2; cursor: number }> {
    const { result, pushNotifications } = await prisma.$transaction(async (tx) => {
        const report = await tx.reportV2.findFirst({ where: { id: reportId } });
        if (!report) throw new ReportNotFoundError();
        if (report.status !== 'submitted') {
            throw new V2ConflictError(
                `Cannot volunteer while report is ${report.status}. Only unassigned (submitted) reports accept volunteers.`
            );
        }
        if (report.assignedCleanerId) {
            throw new V2ConflictError('Report is already assigned to a cleaner.');
        }

        const existing = await tx.volunteerRequestV2.findFirst({
            where: { reportId, cleanerUserId: ctx.userId, status: 'pending' }
        });
        if (existing) {
            // Idempotent: return the pending request instead of duplicating.
            const event = await tx.reportEventV2.findFirst({
                where: { reportId },
                orderBy: { createdAt: 'desc' }
            });
            return {
                result: { request: existing, report, cursor: event?.seq ?? 0 },
                pushNotifications: [] as Array<{
                    userIds: string[];
                    reportId: string;
                    type: string;
                    title: string;
                    body: string;
                }>
            };
        }

        const volunteerRequest = await tx.volunteerRequestV2.create({
            data: {
                tenantId: tenantId(),
                reportId: report.id,
                cleanerUserId: ctx.userId,
                note: args.note,
                status: 'pending'
            } as Prisma.VolunteerRequestV2UncheckedCreateInput
        });

        const cleaner = await tx.userAccount.findFirst({
            where: { id: ctx.userId },
            select: { name: true }
        });

        const event = await createEvent(tx, {
            reportId: report.id,
            eventType: 'volunteer_requested',
            actorUserId: ctx.userId,
            actorRole: 'cleaner',
            payload: {
                volunteer_request_id: volunteerRequest.id,
                cleaner_user_id: ctx.userId,
                cleaner_name: cleaner?.name,
                note: args.note
            }
        });

        const supervisorIds = await findSupervisorIds(tx, ctx.userId);
        await notifyUsers(tx, {
            userIds: supervisorIds,
            reportId: report.id,
            eventId: event.id,
            title: 'New volunteer request',
            body: `${cleaner?.name ?? 'A cleaner'} volunteered for "${report.title}"`
        });

        return {
            result: { request: volunteerRequest, report, cursor: event.seq },
            pushNotifications: [
                {
                    userIds: supervisorIds,
                    reportId: report.id,
                    type: 'volunteer_requested',
                    title: 'New volunteer request',
                    body: `${cleaner?.name ?? 'A cleaner'} volunteered for "${report.title}"`
                }
            ]
        };
    });

    await Promise.allSettled(
        pushNotifications.map((n) =>
            pushNotificationsService.sendToUsers({
                userIds: n.userIds,
                reportId: n.reportId,
                type: n.type,
                title: n.title,
                body: n.body
            })
        )
    );

    return result;
}

export async function rejectVolunteerRequest(
    ctx: V2AuthContext,
    requestId: string,
    args: { reason: string }
): Promise<{ request: VolunteerRequestV2; cursor: number }> {
    const { result, pushNotifications } = await prisma.$transaction(async (tx) => {
        const existing = await tx.volunteerRequestV2.findFirst({
            where: { id: requestId },
            include: { report: true }
        });
        if (!existing) throw new V2NotFoundError('Volunteer request not found.');
        if (existing.status !== 'pending') {
            throw new V2ConflictError(`Volunteer request is already ${existing.status}.`);
        }

        const request = await tx.volunteerRequestV2.update({
            where: { id: requestId },
            data: { status: 'rejected', decidedByUserId: ctx.userId, decidedAt: new Date() }
        });

        const event = await createEvent(tx, {
            reportId: existing.reportId,
            eventType: 'volunteer_rejected',
            actorUserId: ctx.userId,
            actorRole: 'supervisor',
            payload: {
                volunteer_request_id: requestId,
                cleaner_user_id: existing.cleanerUserId,
                reason: args.reason
            }
        });

        await notifyUsers(tx, {
            userIds: [existing.cleanerUserId],
            reportId: existing.reportId,
            eventId: event.id,
            title: 'Volunteer request declined',
            body: args.reason
        });

        return {
            result: { request, cursor: event.seq },
            pushNotifications: [
                {
                    userIds: [existing.cleanerUserId],
                    reportId: existing.reportId,
                    type: 'volunteer_rejected',
                    title: 'Volunteer request declined',
                    body: args.reason
                }
            ]
        };
    });

    await Promise.allSettled(
        pushNotifications.map((n) =>
            pushNotificationsService.sendToUsers({
                userIds: n.userIds,
                reportId: n.reportId,
                type: n.type,
                title: n.title,
                body: n.body
            })
        )
    );

    return result;
}

/**
 * Called from `assignCleaner` (reports.service): mark the assigned cleaner's
 * pending requests `approved` and stale competing requests for the same
 * report `rejected`. Emits a `volunteer_approved` event when at least one
 * request was approved.
 */
export async function markRequestsOnAssign(
    tx: Tx,
    args: { reportId: string; cleanerUserId: string; supervisorUserId: string }
): Promise<{ approved: number; cursor: number | null }> {
    const tid = tenantId();
    const pending = await tx.volunteerRequestV2.findMany({
        where: { tenantId: tid, reportId: args.reportId, status: 'pending' }
    });
    if (pending.length === 0) return { approved: 0, cursor: null };

    const now = new Date();
    const mine = pending.filter((r) => r.cleanerUserId === args.cleanerUserId);
    const others = pending.filter((r) => r.cleanerUserId !== args.cleanerUserId);

    if (mine.length > 0) {
        await tx.volunteerRequestV2.updateMany({
            where: { id: { in: mine.map((r) => r.id) } },
            data: { status: 'approved', decidedByUserId: args.supervisorUserId, decidedAt: now }
        });
    }
    if (others.length > 0) {
        await tx.volunteerRequestV2.updateMany({
            where: { id: { in: others.map((r) => r.id) } },
            data: { status: 'rejected', decidedByUserId: args.supervisorUserId, decidedAt: now }
        });
    }

    let cursor: number | null = null;
    if (mine.length > 0) {
        const event = await createEvent(tx, {
            reportId: args.reportId,
            eventType: 'volunteer_approved',
            actorUserId: args.supervisorUserId,
            actorRole: 'supervisor',
            payload: {
                cleaner_user_id: args.cleanerUserId,
                approved_request_ids: mine.map((r) => r.id),
                superseded_request_ids: others.map((r) => r.id)
            }
        });
        cursor = event.seq;
        const report = await tx.reportV2.findFirst({ where: { id: args.reportId } });
        await notifyUsers(tx, {
            userIds: [args.cleanerUserId],
            reportId: args.reportId,
            eventId: event.id,
            title: 'Volunteer request approved',
            body: report ? `You were assigned "${report.title}"` : 'You were assigned the task'
        });
        if (others.length > 0) {
            await notifyUsers(tx, {
                userIds: others.map((r) => r.cleanerUserId),
                reportId: args.reportId,
                eventId: event.id,
                title: 'Report assigned to another cleaner',
                body: report?.title ?? 'Volunteer pool closed for this report'
            });
        }
    }

    return { approved: mine.length, cursor };
}
