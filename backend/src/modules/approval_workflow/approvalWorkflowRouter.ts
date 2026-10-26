import { Hono } from "hono";
import { eventBus } from "../../shared/events/eventBus.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { criticalRateLimit } from "../../shared/middleware/rateLimit/critical-rate-limit.js";
import { Authorize } from "../../shared/Authorization/authorize.js";
import { ApprovalWorkflowController } from "./approvalWorkflowController.js";
import { ApprovalWorkflowService } from "./approvalWorkflowService.js";
import { ApprovalWorkflowRepository } from "./approvalWorkflowRepository.js";
import { purchaseRequisitionEvent } from "./approvalWorkflowEventHandler.js";
import type { AppContext } from "../../shared/types/hono.js";

export function createApprovalWorkflow() {
  const router = new Hono<AppContext>();

  const service = new ApprovalWorkflowService(
    new ApprovalWorkflowRepository(),
    eventBus,
  );

  const controller = new ApprovalWorkflowController(service);

  purchaseRequisitionEvent(service);

  router.use(authenticate);
  router.use(criticalRateLimit);

  // POST
  router.post(
    "/create-levels",
    Authorize("approval_workflow:create_level"),
    controller.createLevels,
  );

  router.post(
    "/workflows",
    Authorize("approval_workflow:create_workflow"),
    controller.createWorkflowDefinition,
  );

  router.post(
    "/:approval-workflow-id/approve",
    Authorize("approval_workflow:approve"),
    controller.approve,
  );

  router.post(
    "/:approval-workflow-id/reject",
    Authorize("approval_workflow:reject"),
    controller.reject,
  );

  router.post(
    "/:approval-workflow-id/cancel",
    Authorize("approval_workflow:cancel"),
    controller.cancel,
  );

  // GET
  router.get(
    "/",
    Authorize("approval_workflow:read"),
    controller.approvalWorkflow,
  );

  router.get(
    "/workflows",
    Authorize("approval_workflow:read"),
    controller.workflowCodes,
  );

  router.get(
    "/:approval-workflow-id",
    Authorize("approval_workflow:read"),
    controller.approvalRequest,
  );

  return router;
}
