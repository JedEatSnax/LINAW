import { eventBus } from "../../shared/events/eventBus.js";
import type { purchaseRequisitionSubmittedEvent } from "../../shared/events/purchaseRequisitionSubmissionEvent.js";
import { ApprovalWorkflowService } from "./approvalWorkflowService.js";

let registered = false;

export function purchaseRequisitionEvent(
  approvalWorkflowService: ApprovalWorkflowService,
) {
  if (registered) {
    return;
  }

  registered = true;
  eventBus.subscribe<purchaseRequisitionSubmittedEvent>(
    "purchaseRequisition.submitted",
    async (event) => {
      await approvalWorkflowService.createApprovalRequest({
        purchaseRequisitionId: event.purchaseRequisitionId,
        tenantId: event.tenantId,
        companyId: event.companyId,
        userId: event.userId,
        workflowCode: event.workflowCode,
        entityType: event.entityType,
        submitted_At: event.submittedAt,
      });
    },
  );
}
