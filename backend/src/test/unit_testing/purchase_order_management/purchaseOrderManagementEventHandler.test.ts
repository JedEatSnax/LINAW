import { beforeEach, describe, expect, it, vi } from "vitest";

const { subscribeMock } = vi.hoisted(() => ({
  subscribeMock: vi.fn(),
}));

vi.mock("../../../shared/events/eventBus.js", () => ({
  eventBus: { subscribe: subscribeMock },
}));

import { approvedPrIncoming } from "../../../modules/purchase_order_management/purchaseOrderManagementEventHandler.js";

describe("approvedPrIncoming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the complete scoped approval event to procurement management", async () => {
    const handleApprovedPurchaseRequisition = vi
      .fn()
      .mockResolvedValue(undefined);
    approvedPrIncoming({ handleApprovedPurchaseRequisition } as never);

    const handler = subscribeMock.mock.calls.at(-1)?.[1] as (
      event: unknown,
    ) => Promise<void>;
    await handler({
      purchaseRequisition_id: "requisition-id",
      approvalWorkflow_id: "approval-request-id",
      tenant_id: "tenant-id",
      company_id: "company-id",
    });

    expect(handleApprovedPurchaseRequisition).toHaveBeenCalledWith({
      purchaseRequisition_id: "requisition-id",
      approvalWorkflow_id: "approval-request-id",
      tenant_id: "tenant-id",
      company_id: "company-id",
    });
  });
});
