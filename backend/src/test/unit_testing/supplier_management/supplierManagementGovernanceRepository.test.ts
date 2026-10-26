import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  supplierFindMany: vi.fn(),
  supplierCount: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../../../config/database.js", () => ({
  prisma: {
    supplier: {
      findMany: mocks.supplierFindMany,
      count: mocks.supplierCount,
    },
    $transaction: mocks.transaction,
  },
}));

import { SupplierManagementGovernanceRepository } from "../../../modules/supplier_management/SupplierManagementGovernance/supplierManagementGovernanceRepository.js";

describe("SupplierManagementGovernanceRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.supplierFindMany.mockReturnValue("supplier-query");
    mocks.supplierCount.mockReturnValue("count-query");
    mocks.transaction.mockResolvedValue([[], 0]);
  });

  it("uses the purchasing relationship scope without filtering the supplier tenant", async () => {
    const repository = new SupplierManagementGovernanceRepository();

    await repository.getSuppliers({
      tenant_id: "purchasing-tenant",
      company_id: "purchasing-company",
      page: 1,
      limit: 20,
    });

    expect(mocks.supplierFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "ACTIVE",
          company_relationships: {
            some: {
              tenant_id: "purchasing-tenant",
              company_id: "purchasing-company",
              relationship_status: "ACTIVE",
            },
          },
        },
      }),
    );
    expect(mocks.supplierFindMany.mock.calls[0]?.[0].where).not.toHaveProperty(
      "tenant_id",
    );
  });
});
