import { eventBus } from "../../shared/events/eventBus.js";
import type { ApprovalWorkflowApprovedEvent } from "../../shared/events/approvalWorkflowApprovedEvent.js";
import type { SupplierQuotationSubmittedEvent } from "../../shared/events/supplierQuotationSubmittedEvent.js";
import { SUPPLIER_QUOTATION_SUBMITTED_EVENT } from "../../shared/events/eventNames.js";
import { PurchaseOrderManagementService } from "./purchaseOrderManagementService";

export function approvedPrIncoming(
  purchaseOrderManagementService: PurchaseOrderManagementService,
) {
  eventBus.subscribe<ApprovalWorkflowApprovedEvent>(
    "approvalWorkflow.approved",
    async (event) => {
      await purchaseOrderManagementService.handleApprovedPurchaseRequisition({
        purchaseRequisition_id: event.purchaseRequisition_id,
        approvalWorkflow_id: event.approvalWorkflow_id,
        tenant_id: event.tenant_id,
        company_id: event.company_id,
      });
    },
  );
}

export function supplierQuotationSubmittedIncoming(
  purchaseOrderManagementService: PurchaseOrderManagementService,
) {
  eventBus.subscribe<SupplierQuotationSubmittedEvent>(
    SUPPLIER_QUOTATION_SUBMITTED_EVENT,
    async (event) => {
      await purchaseOrderManagementService.handleSupplierQuotationSubmitted(
        event,
      );
    },
  );
}
