export type purchaseRequisitionSubmittedEvent = {
  purchaseRequisitionId: string;
  tenantId: string;
  companyId: string;
  userId: string;
  workflowCode: string;
  entityType: string;
  submittedAt: Date;
};

export type PurchaseRequisitionCancelledEvent = {
  purchaseRequisitionId: string;
  tenantId: string;
  companyId: string;
  userId: string;
  entityType: string;
  cancelledAt: Date;
};
