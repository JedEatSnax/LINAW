ALTER TABLE "PurchaseRequisition"
ADD COLUMN "workflow_code" TEXT;

CREATE INDEX "PurchaseRequisition_workflow_code_idx"
ON "PurchaseRequisition"("workflow_code");