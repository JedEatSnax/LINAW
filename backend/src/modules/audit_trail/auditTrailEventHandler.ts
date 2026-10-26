import { eventBus } from "../../shared/events/eventBus.js";
import {
  PURCHASE_ORDER_AUDIT_EVENT,
  type PurchaseOrderAuditEvent,
} from "../../shared/events/purchaseOrderEvents.js";
import { AuditTrailService } from "./auditTrailService.js";

let auditTrailEventsRegistered = false;

export function registerAuditTrailEvents(auditTrailService: AuditTrailService) {
  if (auditTrailEventsRegistered) {
    return;
  }

  auditTrailEventsRegistered = true;

  eventBus.subscribe<PurchaseOrderAuditEvent>(
    PURCHASE_ORDER_AUDIT_EVENT,
    async (event) => {
      await auditTrailService.createPOMAuditTrail(event);
    },
  );
}
