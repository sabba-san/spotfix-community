-- Add a durable link from reconciled V2 reports to their legacy V1 source.
ALTER TABLE "ReportV2" ADD COLUMN "legacyReportId" TEXT;

CREATE UNIQUE INDEX "ReportV2_tenantId_legacyReportId_key"
ON "ReportV2"("tenantId", "legacyReportId");
