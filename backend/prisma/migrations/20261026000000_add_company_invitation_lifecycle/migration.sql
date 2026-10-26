ALTER TABLE "CompanyInvitation"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "expires_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '72 hours');

CREATE INDEX "CompanyInvitation_status_expires_at_idx"
ON "CompanyInvitation"("status", "expires_at");
