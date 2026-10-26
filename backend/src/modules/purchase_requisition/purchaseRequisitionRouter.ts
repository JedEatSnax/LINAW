import type { AppContext } from "../../shared/types/hono.js";
import { Hono } from "hono";
import { PurchaseRequisitionController } from "./purchaseRequisitionController.js";
import { purchaseRequisitionService } from "./purchaseRequisitionService.js";
import { purchaseRequisitionRepository } from "./purchaseRequisitionRepository.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { eventBus } from "../../shared/events/eventBus.js";
import { Authorize } from "../../shared/Authorization/authorize.js";
import { systemPermissions } from "../../shared/Authorization/seeds/systemPermissions.js";
import { criticalRateLimit } from "../../shared/middleware/rateLimit/critical-rate-limit.js";

export function createPurchaseRequistionRouter() {
  const router = new Hono<AppContext>();
  const service = new purchaseRequisitionService(
    new purchaseRequisitionRepository(),
    eventBus,
  );
  const controller = new PurchaseRequisitionController(service);

  router.use(authenticate);

  // Post
  router.post(
    "/create",
    criticalRateLimit,
    Authorize(systemPermissions.purchaseRequisition.create),
    controller.createRequisition,
  );
  router.post(
    "/:requisitionId/submit",
    criticalRateLimit,
    Authorize(systemPermissions.purchaseRequisition.submit),
    controller.submitRequisition,
  );
  router.post(
    "/:requisitionId/cancel",
    criticalRateLimit,
    Authorize(systemPermissions.purchaseRequisition.cancel),
    controller.cancelRequisition,
  );
  router.post(
    "/:requisitionId/resubmit",
    criticalRateLimit,
    Authorize(systemPermissions.purchaseRequisition.submit),
    controller.resubmitRequisition,
  );

  // Get

  router.get(
    "/",
    criticalRateLimit,
    Authorize(systemPermissions.purchaseRequisition.read),
    controller.requisition,
  );
  router.get(
    "/:requisitionId",
    criticalRateLimit,
    Authorize(systemPermissions.purchaseRequisition.read),
    controller.details,
  );

  // Patch
  router.patch(
    "/:requisitionId",
    criticalRateLimit,
    Authorize(systemPermissions.purchaseRequisition.update),
    controller.update,
  );

  return router;
}

/*
    Dev note @Wiii-1:
    Refer to Purchase_Requisition.md API design documentation for endpoint details.
    The default GET endpoint contains query parameter rules and validation requirements
    starting at line 125.
*/
