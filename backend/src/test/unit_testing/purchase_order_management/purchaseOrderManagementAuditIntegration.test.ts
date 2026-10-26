import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventBus } from "../../../shared/events/eventBus.js";
import { registerAuditTrailEvents } from "../../../modules/audit_trail/auditTrailEventHandler.js";
import { PurchaseOrderManagementService } from "../../../modules/purchase_order_management/purchaseOrderManagementService.js";

const repository = {
  findPoById: vi.fn(),
  completePurchaseOrder: vi.fn(),
};

describe("POM completion and Audit Trail event wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delivers completion through the shared event bus to Audit Trail", async () => {
    const createPOMAuditTrail = vi.fn().mockResolvedValue(undefined);
    registerAuditTrailEvents({ createPOMAuditTrail } as never);

    repository.findPoById.mockResolvedValue({
      id: "492d319c-c00b-42d1-8988-72f69a44e05d",
      status: "ORDERED",
    });
    repository.completePurchaseOrder.mockResolvedValue({
      id: "492d319c-c00b-42d1-8988-72f69a44e05d",
      status: "COMPLETED",
    });

    const service = new PurchaseOrderManagementService(
      repository as never,
      eventBus,
    );

    await service.completePurchaseOrder({
      poId: "492d319c-c00b-42d1-8988-72f69a44e05d",
      user_id: "user-id",
      tenant_id: "tenant-id",
      company_id: "company-id",
    });

    expect(createPOMAuditTrail).toHaveBeenCalledWith({
      tenantId: "tenant-id",
      companyId: "company-id",
      actorId: "user-id",
      entityType: "PURCHASE_ORDER",
      entityId: "492d319c-c00b-42d1-8988-72f69a44e05d",
      action: "COMPLETED",
      metadata: {
        purchaseOrderId: "492d319c-c00b-42d1-8988-72f69a44e05d",
        previousStatus: "ORDERED",
        status: "COMPLETED",
      },
    });
  });
});