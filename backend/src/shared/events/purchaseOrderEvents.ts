export type PurchaseOrderCompletedEvent = {
  purchaseOrderId: string;
  tenantId: string;
  actorId: string;
  entityId: string;
  eventType: "COMPLETED";
};

export const PURCHASE_ORDER_AUDIT_EVENT = "purchase-order.audit" as const;

export type PurchaseOrderAuditAction =
  | "RFQ_CREATED"
  | "QUOTATION_SUBMITTED"
  | "QUOTATION_SELECTED"
  | "PURCHASE_ORDER_CREATED"
  | "ISSUED"
  | "ORDERED"
  | "COMPLETED";

export type PurchaseOrderAuditEvent = {
  tenantId: string;
  companyId: string;
  actorId: string | null;
  entityType: "RFQ" | "SUPPLIER_QUOTATION" | "PURCHASE_ORDER";
  entityId: string;
  action: PurchaseOrderAuditAction;
  metadata: Record<string, unknown>;
};
