import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurchaseOrderManagementService } from "../../../modules/purchase_order_management/purchaseOrderManagementService.js";

const repository = {
  findPoById: vi.fn(),
  issuePurchaseOrder: vi.fn(),
  orderPurchaseOrder: vi.fn(),
  completePurchaseOrder: vi.fn(),
};
const eventBus = { publish: vi.fn() };
const service = new PurchaseOrderManagementService(
  repository as never,
  eventBus as never,
);

const input = {
  poId: "po-id",
  user_id: "user-id",
  tenant_id: "tenant-id",
  company_id: "company-id",
};

describe("PurchaseOrderManagementService lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.issuePurchaseOrder.mockResolvedValue({
      id: "po-id",
      status: "ISSUED",
    });
    repository.orderPurchaseOrder.mockResolvedValue({
      id: "po-id",
      status: "ORDERED",
    });
    repository.completePurchaseOrder.mockResolvedValue({
      id: "po-id",
      status: "COMPLETED",
    });
  });

  it("advances a draft PO to issued", async () => {
    repository.findPoById.mockResolvedValue({ id: "po-id", status: "DRAFT" });

    await service.orderPurchaseOrder(input);

    expect(repository.issuePurchaseOrder).toHaveBeenCalledOnce();
    expect(repository.orderPurchaseOrder).not.toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith(
      "purchase-order.audit",
      expect.objectContaining({
        entityId: "po-id",
        action: "ISSUED",
        actorId: "user-id",
      }),
    );
  });

  it("advances an issued PO to ordered", async () => {
    repository.findPoById.mockResolvedValue({ id: "po-id", status: "ISSUED" });

    await service.orderPurchaseOrder(input);

    expect(repository.orderPurchaseOrder).toHaveBeenCalledOnce();
    expect(repository.issuePurchaseOrder).not.toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith(
      "purchase-order.audit",
      expect.objectContaining({
        entityId: "po-id",
        action: "ORDERED",
      }),
    );
  });

  it("completes only an ordered PO", async () => {
    repository.findPoById.mockResolvedValue({ id: "po-id", status: "ORDERED" });

    await service.completePurchaseOrder(input);

    expect(repository.completePurchaseOrder).toHaveBeenCalledOnce();
    expect(eventBus.publish).toHaveBeenCalledWith(
      "purchase-order.audit",
      expect.objectContaining({
        entityId: "po-id",
        action: "COMPLETED",
      }),
    );
  });

  it("rejects completing a PO that is not ordered", async () => {
    repository.findPoById.mockResolvedValue({ id: "po-id", status: "ISSUED" });

    await expect(service.completePurchaseOrder(input)).rejects.toThrow(
      "Only ordered purchase orders can be completed",
    );
    expect(repository.completePurchaseOrder).not.toHaveBeenCalled();
  });
});
