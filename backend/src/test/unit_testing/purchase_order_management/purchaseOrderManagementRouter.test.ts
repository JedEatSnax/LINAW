import { describe, expect, it, vi } from "vitest";

const { createRfqMock, orderPurchaseOrderMock } = vi.hoisted(() => ({
  createRfqMock: vi.fn().mockResolvedValue({ id: "rfq-id" }),
  orderPurchaseOrderMock: vi.fn(),
}));

vi.mock("../../../shared/middleware/authenticate.js", () => ({
  authenticate: async (context: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
    context.set("user", {
      user_id: "user-id",
      tenant_id: "tenant-id",
      company_id: "company-id",
    });
    await next();
  },
}));

vi.mock("../../../shared/Authorization/authorize.js", () => ({
  Authorize: () => async (_context: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

vi.mock("../../../modules/purchase_order_management/purchaseOrderManagementService.js", () => ({
  PurchaseOrderManagementService: class {
    createRFQS = createRfqMock;
    orderPurchaseOrder = orderPurchaseOrderMock;
  },
}));

vi.mock("../../../modules/purchase_order_management/purchaseOrderManagementRepository.js", () => ({
  PurchaseOrderManagementRepository: class {},
}));

vi.mock("../../../modules/purchase_order_management/purchaseOrderManagementEventHandler.js", () => ({
  approvedPrIncoming: vi.fn(),
  supplierQuotationSubmittedIncoming: vi.fn(),
}));

import { createPurchaseOrderManagement } from "../../../modules/purchase_order_management/purchaseOrderManagementRouter.js";

describe("PurchaseOrderManagementRouter", () => {
  it("dispatches RFQ creation before the dynamic purchase-order route", async () => {
    const router = createPurchaseOrderManagement();
    const response = await router.request(
      new Request("http://localhost/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchase_requisition_id: "00000000-0000-1000-8000-000000000001",
          title: "Office equipment quotation",
          closing_date: "2026-11-01",
          rfq_items: [
            {
              line_no: 1,
              description: "Laptop",
              quantity: 1,
              unit_of_measure: "EA",
              specification: "",
            },
          ],
        }),
      }),
      { JWT_ACCESS_SECRET: "test-secret" } as never,
    );

    expect(response.status).toBe(201);
    expect(createRfqMock).toHaveBeenCalledOnce();
    expect(orderPurchaseOrderMock).not.toHaveBeenCalled();
  });
});