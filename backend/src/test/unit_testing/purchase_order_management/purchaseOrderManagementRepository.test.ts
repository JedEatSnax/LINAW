import { describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    rFQ: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../../config/database.js", () => ({ prisma: prismaMock }));

import { PurchaseOrderManagementRepository } from "../../../modules/purchase_order_management/purchaseOrderManagementRepository.js";
import { SupplierManagementPortalRepository } from "../../../modules/supplier_management/supplierManagementPortal/supplierManagementPortalRepository.js";

describe("RFQ repository workflow", () => {
  it("returns the purchasing company name for supplier RFQs", async () => {
    prismaMock.rFQ.findMany.mockResolvedValue([]);

    await new SupplierManagementPortalRepository().getAvailableRFQs({
      supplier_id: "supplier-id",
    });

    expect(prismaMock.rFQ.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          items: true,
          company: {
            select: {
              legal_name: true,
              display_name: true,
            },
          },
        },
      }),
    );
  });

  it("creates assignments for active supplier relationships when publishing", async () => {
    const tx = {
      rFQ: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findFirst: vi.fn().mockResolvedValue({ id: "rfq-id", items: [] }),
      },
      supplierCompanyRelationship: {
        findMany: vi.fn().mockResolvedValue([
          { supplier_id: "supplier-a" },
          { supplier_id: "supplier-b" },
        ]),
      },
      rFQSupplierAssignment: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    await new PurchaseOrderManagementRepository().publishRfq({
      rfq_id: "rfq-id",
      tenant_id: "tenant-id",
      company_id: "company-id",
    });

    expect(tx.rFQSupplierAssignment.createMany).toHaveBeenCalledWith({
      data: [
        {
          tenant_id: "tenant-id",
          company_id: "company-id",
          rfq_id: "rfq-id",
          supplier_id: "supplier-a",
        },
        {
          tenant_id: "tenant-id",
          company_id: "company-id",
          rfq_id: "rfq-id",
          supplier_id: "supplier-b",
        },
      ],
      skipDuplicates: true,
    });
  });
});
