/**
 * v2 volunteer flow integration tests (service-level, real Postgres).
 *
 * Covers: available pool → volunteer request (idempotent) → supervisor
 * queue → reject path, and request → assign approval path (marks matching
 * request approved, supersedes competing requests).
 *
 * Requires DATABASE_URL (docker postgres). Fixtures use a unique tenant slug
 * per run and are cleaned up afterwards.
 */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

import { prismaRaw } from '../src/infra/prisma';
import { prisma } from '../src/infra/prisma';
import { enterTenant } from '../src/infra/tenant-context';
import type { V2AuthContext } from '../src/v2/auth/v2-auth.service';
import { assignCleaner } from '../src/v2/reports/reports.service';
import {
    listAvailableForCleaner,
    listVolunteerRequests,
    rejectVolunteerRequest,
    requestVolunteer
} from '../src/v2/volunteer/volunteer.service';
import { V2ConflictError } from '../src/v2/errors';

const slug = `test-volunteer-${Date.now()}`;
let tenantId = '';
let reporterId = '';
let cleanerAId = '';
let cleanerBId = '';
let supervisorId = '';
let reportId = '';

function ctx(userId: string, name: string, roles: V2AuthContext['roles']): V2AuthContext {
    return {
        userId,
        tenantId,
        deviceId: 'test-device',
        deviceSessionId: 'test-session',
        name,
        roles
    };
}

const cleanerRoles = { reporter: true, supervisor: false, cleaner: true, admin: false };
const supervisorRoles = { reporter: true, supervisor: true, cleaner: false, admin: false };

async function makeUser(name: string, idNumber: string, role: string, email: string) {
    return prismaRaw.userAccount.create({
        data: {
            tenantId,
            name,
            idNumber,
            email,
            role,
            verified: true,
            status: 'active'
        }
    });
}

beforeAll(async () => {
    const tenant = await prismaRaw.tenant.create({
        data: { slug, name: 'Volunteer Test Campus' }
    });
    tenantId = tenant.id;
    enterTenant(tenantId);

    const reporter = await makeUser('Test Reporter', 'REP-VOL-1', 'public', 'vol-reporter@example.com');
    const cleanerA = await makeUser('Cleaner A', 'CLN-VOL-A', 'cleaner', 'vol-cleaner-a@example.com');
    const cleanerB = await makeUser('Cleaner B', 'CLN-VOL-B', 'cleaner', 'vol-cleaner-b@example.com');
    const supervisor = await makeUser('Supervisor S', 'SUP-VOL-1', 'supervisor', 'vol-supervisor@example.com');
    reporterId = reporter.id;
    cleanerAId = cleanerA.id;
    cleanerBId = cleanerB.id;
    supervisorId = supervisor.id;

    await prismaRaw.userRoleV2.createMany({
        data: [
            { tenantId, userId: cleanerAId, role: 'cleaner' },
            { tenantId, userId: cleanerBId, role: 'cleaner' },
            { tenantId, userId: supervisorId, role: 'supervisor' }
        ]
    });

    const report = await prisma.reportV2.create({
        data: {
            tenantId,
            reporterUserId: reporterId,
            title: 'Unassigned spill in test hall',
            description: 'coffee spill',
            locationAddress: 'Test Hall 1',
            status: 'submitted',
            priority: 'medium',
            version: 1
        } as never
    });
    reportId = report.id;
});

afterAll(async () => {
    // Cascade from tenant covers reports/events/requests/notifications.
    await prismaRaw.userRoleV2.deleteMany({ where: { tenantId } });
    await prismaRaw.userAccount.deleteMany({ where: { tenantId } });
    await prismaRaw.tenant.delete({ where: { id: tenantId } });
    await prismaRaw.$disconnect();
});

describe('volunteer approval flow', () => {
    it('lists the submitted report in the cleaner available pool', async () => {
        enterTenant(tenantId);
        const { reports, total } = await listAvailableForCleaner(
            ctx(cleanerAId, 'Cleaner A', cleanerRoles)
        );
        expect(total).toBeGreaterThanOrEqual(1);
        expect(reports.map((r) => r.id)).toContain(reportId);
    });

    it('creates a pending volunteer request + notifies supervisors', async () => {
        enterTenant(tenantId);
        const { request, cursor } = await requestVolunteer(
            ctx(cleanerAId, 'Cleaner A', cleanerRoles),
            reportId,
            { note: 'nearby, can take it' }
        );
        expect(request.status).toBe('pending');
        expect(request.cleanerUserId).toBe(cleanerAId);
        expect(cursor).toBeGreaterThan(0);

        const supervisorNotes = await prisma.notificationV2.findMany({
            where: { userId: supervisorId, reportId }
        });
        expect(supervisorNotes.length).toBeGreaterThanOrEqual(1);
        expect(supervisorNotes[0].title).toBe('New volunteer request');
    });

    it('is idempotent on duplicate volunteer requests', async () => {
        enterTenant(tenantId);
        const first = await requestVolunteer(
            ctx(cleanerAId, 'Cleaner A', cleanerRoles),
            reportId,
            {}
        );
        const second = await requestVolunteer(
            ctx(cleanerAId, 'Cleaner A', cleanerRoles),
            reportId,
            {}
        );
        expect(second.request.id).toBe(first.request.id);
        const count = await prisma.volunteerRequestV2.count({
            where: { reportId, cleanerUserId: cleanerAId, status: 'pending' }
        });
        expect(count).toBe(1);
    });

    it('shows the request in the supervisor queue with cleaner + report', async () => {
        enterTenant(tenantId);
        // Second cleaner volunteers too, to test supersede-on-assign later.
        await requestVolunteer(ctx(cleanerBId, 'Cleaner B', cleanerRoles), reportId, {});
        const { requests, total } = await listVolunteerRequests({ status: 'pending' });
        expect(total).toBeGreaterThanOrEqual(2);
        const mine = requests.find(
            (r) => r.reportId === reportId && r.cleanerUserId === cleanerAId
        );
        expect(mine?.cleaner?.name).toBe('Cleaner A');
        expect(mine?.report?.title).toBe('Unassigned spill in test hall');
    });

    it('approves via assign: matching request approved, competitor superseded', async () => {
        enterTenant(tenantId);
        await assignCleaner(ctx(supervisorId, 'Supervisor S', supervisorRoles), reportId, {
            cleaner_user_id: cleanerAId,
            note: 'approved volunteer'
        });

        const approved = await prisma.volunteerRequestV2.findFirst({
            where: { reportId, cleanerUserId: cleanerAId }
        });
        expect(approved?.status).toBe('approved');
        const superseded = await prisma.volunteerRequestV2.findFirst({
            where: { reportId, cleanerUserId: cleanerBId }
        });
        expect(superseded?.status).toBe('rejected');

        const report = await prisma.reportV2.findFirst({ where: { id: reportId } });
        expect(report?.status).toBe('assigned');
        expect(report?.assignedCleanerId).toBe(cleanerAId);
    });

    it('rejects volunteering on an assigned report with 409', async () => {
        enterTenant(tenantId);
        await expect(
            requestVolunteer(ctx(cleanerBId, 'Cleaner B', cleanerRoles), reportId, {})
        ).rejects.toBeInstanceOf(V2ConflictError);
    });

    it('supports supervisor reject with reason + cleaner notification', async () => {
        enterTenant(tenantId);
        // Fresh submitted report for the reject path.
        const fresh = await prisma.reportV2.create({
            data: {
                tenantId,
                reporterUserId: reporterId,
                title: 'Second unassigned issue',
                status: 'submitted',
                priority: 'low',
                version: 1
            } as never
        });
        const { request } = await requestVolunteer(
            ctx(cleanerBId, 'Cleaner B', cleanerRoles),
            fresh.id,
            {}
        );
        const { request: rejected } = await rejectVolunteerRequest(
            ctx(supervisorId, 'Supervisor S', supervisorRoles),
            request.id,
            { reason: 'zone covered by team A' }
        );
        expect(rejected.status).toBe('rejected');

        const notes = await prisma.notificationV2.findMany({
            where: { userId: cleanerBId, reportId: fresh.id }
        });
        expect(notes.some((n) => n.title === 'Volunteer request declined')).toBe(true);
    });
});
