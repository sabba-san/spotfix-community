/**
 * scripts/seed-reports.ts
 *
 * Seeds realistic starter reports and a demo public reporter account into the
 * Postgres database for the active tenant, then synchronizes them to ReportV2.
 *
 * Usage:
 *   npm --prefix apps/api run seed:reports
 */
import bcrypt from 'bcryptjs';
import { prismaRaw } from '../src/infra/prisma';
import { enterTenant } from '../src/infra/tenant-context';
import { reconcileLegacyReports } from '../src/v2/reports/sync.service';

async function seed(): Promise<void> {
    const slug = process.env.DEFAULT_TENANT_SLUG?.trim() || 'example-campus';
    const tenant = await prismaRaw.tenant.findUnique({ where: { slug } });
    if (!tenant) {
        throw new Error(`Tenant '${slug}' not found. Run bootstrap first.`);
    }

    const tenantId = tenant.id;
    console.log(`Seeding reports for tenant: ${tenant.slug} (${tenantId})`);

    // 1. Ensure a public reporter exists
    const passwordHash = await bcrypt.hash('password123', 12);
    const reporter = await prismaRaw.userAccount.upsert({
        where: {
            tenantId_idNumber: {
                tenantId,
                idNumber: 'USR-001'
            }
        },
        update: {
            name: 'Jordan Smith',
            role: 'public',
            email: 'reporter@spotfix.test',
            phone: '+65 9123 4567',
            passwordHash,
            verified: true,
            status: 'active'
        },
        create: {
            tenantId,
            idNumber: 'USR-001',
            name: 'Jordan Smith',
            role: 'public',
            email: 'reporter@spotfix.test',
            phone: '+65 9123 4567',
            passwordHash,
            verified: true,
            status: 'active'
        }
    });
    console.log(`Reporter ready: ${reporter.name} (${reporter.idNumber})`);

    // 2. Fetch staff for assignments
    const supervisor = await prismaRaw.userAccount.findFirst({
        where: { tenantId, idNumber: 'SUP-001' }
    });
    const cleaner1 = await prismaRaw.userAccount.findFirst({
        where: { tenantId, idNumber: 'CLN-001' }
    });
    const cleaner2 = await prismaRaw.userAccount.findFirst({
        where: { tenantId, idNumber: 'CLN-002' }
    });

    const cleanerRoster1 = await prismaRaw.cleaner.findFirst({
        where: { tenantId, workId: 'CLN-001' }
    });

    // 3. Sample reports definition
    const sampleReports = [
        {
            publicId: 'RPT-10001',
            status: 'Reported',
            priority: 'High',
            category: 'Safety',
            location: 'Main Library 2F - Stairwell B',
            details: 'Loose handrail on staircase between 1st and 2nd floor, wobbles when gripped.',
            coordinates: { lat: 3.1402, lng: 101.6871 },
            reporterPhone: '+65 9123 4567',
            userId: reporter.id,
            userName: reporter.name
        },
        {
            publicId: 'RPT-10002',
            status: 'Reported',
            priority: 'Critical',
            category: 'Plumbing',
            location: 'Sports Centre Ground Floor Restrooms',
            details: 'Active water leak beneath main sink counter, pooling across doorway.',
            coordinates: { lat: 3.1372, lng: 101.6842 },
            reporterPhone: '+65 9123 4567',
            userId: reporter.id,
            userName: reporter.name
        },
        {
            publicId: 'RPT-10003',
            status: 'Assigned',
            priority: 'Medium',
            category: 'Electrical',
            location: 'Admin Building Room 204',
            details: 'Ceiling projector flickering and power outlet humming intermittently.',
            coordinates: { lat: 3.1424, lng: 101.6875 },
            reporterPhone: '+65 9123 4567',
            userId: reporter.id,
            userName: reporter.name,
            assignedTo: cleaner1?.name || 'Jamie Chen',
            assignedToCleanerId: cleaner1?.id,
            assignedBySupervisorId: supervisor?.id,
            assignedBySupervisorName: supervisor?.name
        },
        {
            publicId: 'RPT-10004',
            status: 'In Progress',
            priority: 'Low',
            category: 'Cleaning',
            location: 'Student Residence Block B Lobby',
            details: 'Recycling bin overflowing and cardboard boxes piled beside entrance.',
            coordinates: { lat: 3.1361, lng: 101.6892 },
            reporterPhone: '+65 9123 4567',
            userId: reporter.id,
            userName: reporter.name,
            assignedTo: cleaner2?.name || 'Taylor Morgan',
            assignedToCleanerId: cleaner2?.id,
            assignedBySupervisorId: supervisor?.id,
            assignedBySupervisorName: supervisor?.name
        },
        {
            publicId: 'RPT-10005',
            status: 'Awaiting Endorsement',
            priority: 'Medium',
            category: 'Facilities',
            location: 'Sports Centre Level 1 Gymnasium',
            details: 'Damaged locker latch repaired; awaiting supervisor review and sign-off.',
            coordinates: { lat: 3.1371, lng: 101.6841 },
            reporterPhone: '+65 9123 4567',
            userId: reporter.id,
            userName: reporter.name,
            assignedTo: cleaner1?.name || 'Jamie Chen',
            assignedToCleanerId: cleaner1?.id,
            assignedBySupervisorId: supervisor?.id,
            assignedBySupervisorName: supervisor?.name
        },
        {
            publicId: 'RPT-10006',
            status: 'Resolved',
            priority: 'Low',
            category: 'Maintenance',
            location: 'Main Entrance Foyer',
            details: 'Burned-out overhead light bulb replaced and tested operational.',
            coordinates: { lat: 3.1346, lng: 101.6861 },
            reporterPhone: '+65 9123 4567',
            userId: reporter.id,
            userName: reporter.name,
            assignedTo: cleaner1?.name || 'Jamie Chen',
            assignedToCleanerId: cleaner1?.id,
            assignedBySupervisorId: supervisor?.id,
            assignedBySupervisorName: supervisor?.name,
            reviewedAt: new Date().toISOString(),
            reviewedBySupervisorId: supervisor?.id,
            reviewedBySupervisorName: supervisor?.name,
            reviewNotes: 'Verified fix on site. Work complete.'
        }
    ];

    for (const item of sampleReports) {
        await prismaRaw.report.upsert({
            where: {
                tenantId_publicId: {
                    tenantId,
                    publicId: item.publicId
                }
            },
            update: {
                status: item.status,
                priority: item.priority,
                category: item.category,
                location: item.location,
                details: item.details,
                coordinates: item.coordinates,
                reporterPhone: item.reporterPhone,
                userId: item.userId,
                userName: item.userName,
                assignedTo: item.assignedTo || null,
                assignedToCleanerId: item.assignedToCleanerId || null,
                assignedBySupervisorId: item.assignedBySupervisorId || null,
                assignedBySupervisorName: item.assignedBySupervisorName || null,
                reviewedAt: item.reviewedAt || null,
                reviewedBySupervisorId: item.reviewedBySupervisorId || null,
                reviewedBySupervisorName: item.reviewedBySupervisorName || null,
                reviewNotes: item.reviewNotes || null
            },
            create: {
                tenantId,
                publicId: item.publicId,
                status: item.status,
                priority: item.priority,
                category: item.category,
                location: item.location,
                details: item.details,
                coordinates: item.coordinates,
                reporterPhone: item.reporterPhone,
                userId: item.userId,
                userName: item.userName,
                assignedTo: item.assignedTo || null,
                assignedToCleanerId: item.assignedToCleanerId || null,
                assignedBySupervisorId: item.assignedBySupervisorId || null,
                assignedBySupervisorName: item.assignedBySupervisorName || null,
                reviewedAt: item.reviewedAt || null,
                reviewedBySupervisorId: item.reviewedBySupervisorId || null,
                reviewedBySupervisorName: item.reviewedBySupervisorName || null,
                reviewNotes: item.reviewNotes || null
            }
        });
        console.log(`Upserted report: ${item.publicId} (${item.status})`);
    }

    // 4. Update cleaner roster state to reflect active assignment
    if (cleanerRoster1) {
        await prismaRaw.cleaner.update({
            where: { id: cleanerRoster1.id },
            data: {
                assignedTaskId: 'RPT-10003'
            }
        });
        console.log(`Updated cleaner ${cleanerRoster1.name} assigned task to RPT-10003`);
    }

    // 5. Run sync to ensure ReportV2 matches
    console.log('Reconciling reports to v2...');
    enterTenant(tenantId);
    const result = await reconcileLegacyReports();
    console.log(`Reconciled reports: imported=${result.imported}, skipped=${result.skipped}`);

    console.log('Seed completed successfully!');
}

seed()
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
