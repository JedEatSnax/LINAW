import { describe, expect, it } from "vitest";
import { PurchaseRequisitionQuerySchema } from "../../../modules/purchase_requisition/purchaseRequisitionValidation.js";

describe("Purchase requisition query validation", () => {
  it("accepts CANCELLED status and normalizes referenceNo", () => {
    const result = PurchaseRequisitionQuerySchema.parse({
      status: "CANCELLED",
      referenceNo: "PR-20261015-001-01",
    });

    expect(result).toEqual({
      status: "CANCELLED",
      referenceNo: "PR-20261015-001-01",
      pr_number: "PR-20261015-001-01",
    });
  });

  it("rejects an invalid requester ID", () => {
    expect(() =>
      PurchaseRequisitionQuerySchema.parse({
        requesterId: "not-a-uuid",
      }),
    ).toThrow();
  });
});
