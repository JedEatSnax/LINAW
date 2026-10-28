import { Hono } from "hono";
import type { AppContext } from "../../shared/types/hono";
import { authenticate } from "../../shared/middleware/authenticate";
import { PurchaseOrderManagementController } from "./purchaseOrderManagementController";
import { PurchaseOrderManagementService } from "./purchaseOrderManagementService";
import { PurchaseOrderManagementRepository } from "./purchaseOrderManagementRepository";
import { eventBus } from "../../shared/events/eventBus";
import { Authorize } from "../../shared/Authorization/authorize";
import { systemPermissions } from "../../shared/Authorization/seeds/systemPermissions";
import {
  approvedPrIncoming,
  supplierQuotationSubmittedIncoming,
} from "./purchaseOrderManagementEventHandler";

const service = new PurchaseOrderManagementService(
  new PurchaseOrderManagementRepository(),
  eventBus,
);
let eventsRegistered = false;

export function createPurchaseOrderManagement() {
  const router = new Hono<AppContext>();

  const controller = new PurchaseOrderManagementController(service);

  if (!eventsRegistered) {
    approvedPrIncoming(service);
    supplierQuotationSubmittedIncoming(service);
    eventsRegistered = true;
  }

  router.use(authenticate);

  // POST

  router.post(
    "/rfqs",
    Authorize(systemPermissions.purchaseOrderManagement.createRFQ),
    controller.createRFQS,
  );
  router.post(
    "/:poId",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.orderPurchaseOrder,
  );
  router.post(
    "/:poId/complete",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.completePurchaseOrder,
  );
  router.post(
    "/rfqs/:rfqId/publish",
    Authorize(systemPermissions.purchaseOrderManagement.updateRFQ),
    controller.publishRfqs,
  );
  router.post(
    "/rfqs/:rfqId/quotations/:quotationId/select",
    Authorize(systemPermissions.purchaseOrderManagement.acceptQuotation),
    controller.selectSupplier,
  );

  // GET

  router.get(
    "/procurement-queue",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.getApprovedPurchaseRequisition,
  );
  router.get(
    "/reports/monthly-completed",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.getMonthlyCompletedProcurementReport,
  );
  router.get(
    "/",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.getList,
  );
  router.get(
    "/rfqs",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.getRfqs,
  );
  router.get(
    "/quotations",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.getAllQuotations,
  );
  router.get(
    "/rfqs/:rfqId/quotations",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.getQuotationList,
  );
  router.get(
    "/rfqs/:rfqId/quotations/:quotationId",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.getQuotation,
  );
  router.get(
    "/:poId",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.getPO,
  );

  // PATCH

  router.patch(
    "/rfqs/:rfqId",
    Authorize(systemPermissions.purchaseOrderManagement.updateRFQ),
    controller.updateRfq,
  );
  router.patch(
    "/:poId",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.updatePo,
  );

  // DELETE

  router.delete(
    "/rfqs/:rfqId",
    Authorize(systemPermissions.purchaseOrderManagement.deleteRFQ),
    controller.deleteRfq,
  );
  router.delete(
    "/:poId",
    Authorize(systemPermissions.purchaseOrderManagement.read),
    controller.deletePurchaseOrder,
  );

  return router;
}
