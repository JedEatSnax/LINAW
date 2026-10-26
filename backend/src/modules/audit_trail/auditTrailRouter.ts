import { Hono } from "hono";

import { auditTrailController } from "./auditTrailController.js";
import { AuditTrailService } from "./auditTrailService.js";
import { authenticate } from "../../shared/middleware/authenticate.js";

import { Authorize } from "../../shared/Authorization/authorize.js";
import { systemPermissions } from "../../shared/Authorization/seeds/systemPermissions.js";
import { criticalRateLimit } from "../../shared/middleware/rateLimit/critical-rate-limit.js";
import type { AppContext } from "../../shared/types/hono.js";

export function createAuditRouter(service: AuditTrailService) {
  const router = new Hono<AppContext>();

  const controller = new auditTrailController(service);

  router.use(criticalRateLimit);
  router.use(authenticate);

  router.get(
    "/",
    Authorize(systemPermissions.auditTrail.search),
    controller.listAuditRecords,
  );
  router.get(
    "/search",
    Authorize(systemPermissions.auditTrail.search),
    controller.searchAuditRecord,
  );
  router.get(
    "/:auditId/verify",
    Authorize(systemPermissions.auditTrail.verify),
    controller.verifyAuditIntegrity,
  );

  return router;
}
