import { beforeEach, describe, expect, it, vi } from "vitest";
import { Decimal } from "decimal.js";
import { purchaseRequisitionService } from "../../../modules/purchase_requisition/purchaseRequisitionService.js";

const repository = {
  findByRequisitionId: vi.fn(),
  findActiveByUserId: vi.fn(),
  updateStatusWithStatusLog: vi.fn(),
};

const approvalWorkflowRepository = {
  findApprovalWorkflowDefinition: vi.fn(),
  getLevels: vi.fn(),
};

const eventBus = { publish: vi.fn() };
const service = new purchaseRequisitionService(
  repository as never,
  eventBus as never,
  approvalWorkflowRepository as never,
);

const input = {
  requisitionId: "requisition-id",
  userId: "user-id",
  tenantId: "tenant-id",
  companyId: "company-id",
};

describe("purchaseRequisitionService.submitRequisition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.findByRequisitionId.mockResolvedValue({
      id: "requisition-id",
      tenant_id: "tenant-id",
      company_id: "company-id",
      requested_by_user_id: "user-id",
      workflow_code: "PURCHASE_REQUISITION",
      status: "DRAFT",
      total_amount: new Decimal("151413"),
    });
    repository.findActiveByUserId.mockResolvedValue({ company_id: "company-id" });
    approvalWorkflowRepository.findApprovalWorkflowDefinition.mockResolvedValue({
      id: "workflow-id",
      entity_type: "purchase_requisition",
    });
    repository.updateStatusWithStatusLog.mockResolvedValue({
      id: "requisition-id",
      tenant_id: "tenant-id",
      company_id: "company-id",
      requested_by_user_id: "user-id",
      workflow_code: "PURCHASE_REQUISITION",
      status: "SUBMITTED",
      submitted_at: new Date("2026-10-25T00:00:00.000Z"),
    });
  });

  it("rejects an amount outside configured levels before changing PR state", async () => {
    approvalWorkflowRepository.getLevels.mockResolvedValue([
      {
        min_amount: new Decimal("0"),
        max_amount: new Decimal("0"),
      },
    ]);

    await expect(service.submitRequisition(input)).rejects.toThrow(
      "No approval level matches the purchase requisition amount",
    );

    expect(repository.updateStatusWithStatusLog).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("submits when the persisted amount matches a configured level", async () => {
    approvalWorkflowRepository.getLevels.mockResolvedValue([
      {
        min_amount: new Decimal("0"),
        max_amount: new Decimal("200000"),
      },
    ]);

    await service.submitRequisition(input);

    expect(repository.updateStatusWithStatusLog).toHaveBeenCalledOnce();
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });
});
