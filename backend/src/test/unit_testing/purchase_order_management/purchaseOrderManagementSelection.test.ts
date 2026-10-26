import { describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
  },
}));

vi.mock("../../../config/database.js", () => ({ prisma: prismaMock }));

import { PurchaseOrderManagementRepository } from "../../../modules/purchase_order_management/purchaseOrderManagementRepository.js";

describe("PurchaseOrderManagementRepository.selectSupplier", () => {
  it("creates a draft PO from the selected posted quotation in one transaction", async () => {
    const purchaseOrderCreate = vi.fn().mockResolvedValue({
      id: "po-id",
      status: "DRAFT",
    });
    const tx = {
      rFQ: {
        findFirst: vi.fn().mockResolvedValue({
          id: "rfq-id",
          purchase_requisition_id: "pr-id",
        }),
      },
      supplierQuotation: {
        findFirst: vi.fn().mockResolvedValue({
          id: "quotation-id",
          supplier_id: "supplier-id",
          currency_code: "USD",
          total_amount: "125.00",
          items: [
            {
              rfq_item_id: "rfq-item-id",
              line_no: 1,
              quoted_quantity: "1",
              unit_price: "125.00",
              total_price: "125.00",
            },
          ],
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      rFQItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "rfq-item-id",
            description: "Laptop",
            unit_of_measure: "EA",
          },
        ]),
      },
      rFQSupplierAssignment: {
        findFirst: vi.fn().mockResolvedValue({ id: "assignment-id" }),
      },
      purchaseOrder: {
        create: purchaseOrderCreate,
      },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    await new PurchaseOrderManagementRepository().selectSupplier({
      id: "po-id",
      tenant_id: "tenant-id",
      company_id: "company-id",
      user_id: "user-id",
      rfq_id: "rfq-id",
      quotation_id: "quotation-id",
      supplier_id: "supplier-id",
      po_number: "po-number",
      order_date: new Date("2026-10-25T00:00:00.000Z"),
      expected_delivery_date: undefined,
    });

    expect(purchaseOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          purchase_requisition_id: "pr-id",
          rfq_id: "rfq-id",
          supplier_quotation_id: "quotation-id",
          supplier_id: "supplier-id",
          status: "DRAFT",
        }),
      }),
    );
  });
});
