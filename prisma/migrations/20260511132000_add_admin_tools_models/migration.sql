-- CreateEnum
CREATE TYPE "DomainOverrideVerdict" AS ENUM ('trusted', 'suspicious', 'high_risk', 'none');

-- CreateTable
CREATE TABLE "DomainAdminOverride" (
  "id" TEXT NOT NULL,
  "domain" VARCHAR(2048) NOT NULL,
  "overrideVerdict" "DomainOverrideVerdict" NOT NULL DEFAULT 'none',
  "note" TEXT,
  "createdByUserId" VARCHAR(128),
  "createdByEmail" VARCHAR(320),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DomainAdminOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanAdminActionLog" (
  "id" TEXT NOT NULL,
  "actionType" VARCHAR(64) NOT NULL,
  "domain" VARCHAR(2048),
  "scanId" VARCHAR(64),
  "metadata" JSONB,
  "createdByUserId" VARCHAR(128),
  "createdByEmail" VARCHAR(320),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ScanAdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DomainAdminOverride_domain_key" ON "DomainAdminOverride"("domain");

-- CreateIndex
CREATE INDEX "ScanAdminActionLog_actionType_createdAt_idx" ON "ScanAdminActionLog"("actionType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ScanAdminActionLog_domain_createdAt_idx" ON "ScanAdminActionLog"("domain", "createdAt" DESC);
