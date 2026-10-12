-- Better Auth identifies accounts by providerId and accountId.
DROP INDEX "account_issuer_accountId_uidx";

ALTER TABLE "account" DROP COLUMN "issuer";

CREATE UNIQUE INDEX "account_providerId_accountId_uidx"
ON "account"("providerId", "accountId");