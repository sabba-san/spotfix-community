import { Prisma } from '@prisma/client';

import { prisma } from '../../infra/prisma';
import { currentTenantId } from '../../infra/tenant-context';
import { logger } from '../../config/logger';
import type { ReportV2Status } from './reports.service';

type LegacyReport = {
    id: string;
    publicId: string;
    status: string;
    timestamp: Date;
    priority: string;
    category: string | null;
    location: string | null;
    details: string | null;
    coordinates: unknown;
    userId: string;
    userName: string | null;
    evidencePhoto: string | null;
    photos: unknown;
    assignedToCleanerId: string | null;
    assignedBySupervisorId: string | null;
};

function tenantId(): string {
    const id = currentTenantId();
    if (!id) throw new Error('Tenant scope is not set.');
    return id;
}

function mapPriority(priority: string | null | undefined): 'low' | 'medium' | 'high' {
    const value = priority?.toLowerCase();
    if (value === 'critical' || value === 'high') return 'high';
    if (value === 'low') return 'low';
    return 'medium';
}

function mapStatus(legacy: LegacyReport): ReportV2Status {
    const value = legacy.status.trim().toLowerCase().replace(/\s+/g, '_');
    if (value === 'assigned' && legacy.assignedToCleanerId) return 'assigned';
    if (value === 'in_progress' && legacy.assignedToCleanerId) return 'in_progress';
    if (value === 'awaiting_endorsement' && legacy.assignedToCleanerId) return 'resolved_by_cleaner';
    if (value === 'resolved' && legacy.assignedToCleanerId) return 'resolved_by_cleaner';
    if (value === 'rejected_by_cleaner' && legacy.assignedToCleanerId) return 'rejected_by_cleaner';
    if (value === 'cancelled' || value === 'canceled') return 'cancelled';

    // Unknown or incomplete legacy states remain visible in the Supervisor queue.
    return value === 'rejected' ? 'rejected_by_supervisor' : 'submitted';
}

function coordinateValue(coordinates: unknown, key: 'lat' | 'lng'): number | undefined {
    if (!coordinates || typeof coordinates !== 'object') return undefined;
    const value = (coordinates as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : undefined;
}

function attachmentValues(legacy: LegacyReport): string[] {
    const values: string[] = [];
    if (legacy.evidencePhoto) values.push(legacy.evidencePhoto);
    if (Array.isArray(legacy.photos)) {
        for (const photo of legacy.photos) {
            const value = typeof photo === 'string'
                ? photo
                : photo && typeof photo === 'object' && typeof (photo as { url?: unknown }).url === 'string'
                    ? (photo as { url: string }).url
                    : photo && typeof photo === 'object' && typeof (photo as { key?: unknown }).key === 'string'
                        ? (photo as { key: string }).key
                        : undefined;
            if (value && !values.includes(value)) values.push(value);
        }
    }
    return values;
}

function legacyTitle(report: LegacyReport): string {
    return report.category?.trim() ? `${report.category.trim()} report` : 'Community report';
}

export async function reconcileLegacyReports(): Promise<{ imported: number; skipped: number }> {
    const tid = tenantId();
    const [legacyReports, existing, users] = await Promise.all([
        prisma.report.findMany({
            orderBy: { timestamp: 'asc' }
        }) as Promise<LegacyReport[]>,
        prisma.reportV2.findMany({ select: { legacyReportId: true } }),
        prisma.userAccount.findMany({ select: { id: true } })
    ]);

    const existingIds = new Set(existing.map((report) => report.legacyReportId).filter(Boolean));
    const userIds = new Set(users.map((user) => user.id));
    let imported = 0;
    let skipped = 0;

    for (const legacy of legacyReports) {
        if (existingIds.has(legacy.publicId) || !userIds.has(legacy.userId)) {
            skipped += 1;
            if (!userIds.has(legacy.userId)) {
                logger.warn({ legacyReportId: legacy.publicId }, 'Skipping legacy report with missing reporter');
            }
            continue;
        }

        const assignedCleanerId = legacy.assignedToCleanerId && userIds.has(legacy.assignedToCleanerId)
            ? legacy.assignedToCleanerId
            : null;
        const assignedSupervisorId = legacy.assignedBySupervisorId && userIds.has(legacy.assignedBySupervisorId)
            ? legacy.assignedBySupervisorId
            : null;
        const status = mapStatus({ ...legacy, assignedToCleanerId: assignedCleanerId });
        const photos = attachmentValues(legacy);

        try {
            await prisma.$transaction(async (tx) => {
                const report = await tx.reportV2.create({
                    data: {
                        tenantId: tid,
                        legacyReportId: legacy.publicId,
                        reporterUserId: legacy.userId,
                        assignedSupervisorId,
                        assignedCleanerId,
                        title: legacyTitle(legacy),
                        description: legacy.details,
                        locationLat: coordinateValue(legacy.coordinates, 'lat'),
                        locationLng: coordinateValue(legacy.coordinates, 'lng'),
                        locationAddress: legacy.location,
                        priority: mapPriority(legacy.priority),
                        status,
                        createdAt: legacy.timestamp,
                        version: 1
                    } as Prisma.ReportV2UncheckedCreateInput
                });

                if (photos.length > 0) {
                    await tx.reportAttachmentV2.createMany({
                        data: photos.map((fileUrl) => ({
                            tenantId: tid,
                            reportId: report.id,
                            uploadedByUserId: legacy.userId,
                            attachmentType: 'report_evidence',
                            fileUrl
                        })) as Prisma.ReportAttachmentV2UncheckedCreateInput[]
                    });
                }

                await tx.reportEventV2.create({
                    data: {
                        tenantId: tid,
                        reportId: report.id,
                        eventType: 'report_created',
                        actorUserId: legacy.userId,
                        actorRole: 'reporter',
                        payload: {
                            source: 'legacy_v1',
                            legacy_report_id: legacy.publicId,
                            legacy_status: legacy.status
                        }
                    } as Prisma.ReportEventV2UncheckedCreateInput
                });
            });
            existingIds.add(legacy.publicId);
            imported += 1;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                skipped += 1;
                existingIds.add(legacy.publicId);
                continue;
            }
            throw error;
        }
    }

    return { imported, skipped };
}
