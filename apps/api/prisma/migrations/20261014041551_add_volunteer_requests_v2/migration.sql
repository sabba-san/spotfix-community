-- AlterTable
ALTER TABLE "CampusLandmarkV2" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DeviceRegistration" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DeviceV2" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TenantGeoV2" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserRoleV2" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "VolunteerRequestV2" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "cleanerUserId" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerRequestV2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VolunteerRequestV2_tenantId_status_createdAt_idx" ON "VolunteerRequestV2"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "VolunteerRequestV2_tenantId_reportId_status_idx" ON "VolunteerRequestV2"("tenantId", "reportId", "status");

-- CreateIndex
CREATE INDEX "VolunteerRequestV2_tenantId_cleanerUserId_status_idx" ON "VolunteerRequestV2"("tenantId", "cleanerUserId", "status");

-- AddForeignKey
ALTER TABLE "VolunteerRequestV2" ADD CONSTRAINT "VolunteerRequestV2_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerRequestV2" ADD CONSTRAINT "VolunteerRequestV2_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ReportV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerRequestV2" ADD CONSTRAINT "VolunteerRequestV2_cleanerUserId_fkey" FOREIGN KEY ("cleanerUserId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
