/**
 * v2 workforce service — cleaner roster for the supervisor desk.
 *
 * V1 keeps a separate `Cleaner` roster table with no link to `UserAccount`,
 * but v2 assignment addresses the `UserAccount` id (`cleaner_user_id`). This
 * lists every cleaner-capable user (v1 column lift + UserRoleV2 rows) with
 * live availability derived from active v2 assignments, so the web
 * "Select cleaner…" dropdown and the workforce roster share one source.
 */
import { prisma } from '../../infra/prisma';
import { currentTenantId } from '../../infra/tenant-context';
import { V2ValidationError } from '../errors';

export interface CleanerWorkforceEntry {
    userId: string;
    name: string;
    idNumber: string;
    phone: string | null;
    workLocation: string | null;
    isBusy: boolean;
    activeTaskCount: number;
}

const ACTIVE_STATUSES = ['assigned', 'accepted_by_cleaner', 'in_progress'];

function tenantId(): string {
    const t = currentTenantId();
    if (!t) throw new V2ValidationError('Tenant scope is not set.');
    return t;
}

export async function listCleanersForSupervisor(args: {
    search?: string;
    limit?: number;
}): Promise<{ cleaners: CleanerWorkforceEntry[] }> {
    const tid = tenantId();
    const limit = Math.min(200, Math.max(1, args.limit ?? 200));

    const v2Rows = await prisma.userRoleV2.findMany({
        where: { tenantId: tid, role: 'cleaner' },
        select: { userId: true }
    });
    const v1Rows = await prisma.userAccount.findMany({
        where: { tenantId: tid, role: 'cleaner' },
        select: { id: true }
    });
    const ids = Array.from(new Set([...v2Rows.map((r) => r.userId), ...v1Rows.map((r) => r.id)]));
    if (ids.length === 0) return { cleaners: [] };

    const users = await prisma.userAccount.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, idNumber: true, phone: true, workLocation: true, status: true },
        orderBy: { name: 'asc' },
        take: limit
    });

    const active = await prisma.reportV2.groupBy({
        by: ['assignedCleanerId'],
        where: { assignedCleanerId: { in: ids }, status: { in: ACTIVE_STATUSES } },
        _count: { _all: true }
    });
    const busyByUser = new Map<string, number>();
    for (const row of active) {
        if (row.assignedCleanerId) busyByUser.set(row.assignedCleanerId, row._count._all);
    }

    const q = args.search?.trim().toLowerCase();
    const cleaners: CleanerWorkforceEntry[] = users
        .filter((u) => u.status === 'active')
        .map((u) => ({
            userId: u.id,
            name: u.name,
            idNumber: u.idNumber,
            phone: u.phone,
            workLocation: u.workLocation,
            activeTaskCount: busyByUser.get(u.id) ?? 0,
            isBusy: (busyByUser.get(u.id) ?? 0) > 0
        }))
        .filter(
            (c) =>
                !q ||
                c.name.toLowerCase().includes(q) ||
                c.idNumber.toLowerCase().includes(q) ||
                (c.workLocation ?? '').toLowerCase().includes(q)
        );

    return { cleaners };
}
