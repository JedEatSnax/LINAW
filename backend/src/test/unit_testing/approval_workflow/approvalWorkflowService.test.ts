import { beforeEach, describe, expect, it, vi } from "vitest";
import { Decimal } from "decimal.js";
import { ApprovalWorkflowService } from "../../../modules/approval_workflow/approvalWorkflowService.js";

describe("ApprovalWorkflowService.createApprovalRequest", () => {
  const repository = {
    findApprovalWorkflowDefinition: vi.fn(),
    findApprovalRequestByEntity: vi.fn(),
    findRequisitionById: vi.fn(),
    getLevels: vi.fn(),
    createApprovalRequest: vi.fn(),
  };
  const eventBus = { publish: vi.fn() };
  const service = new ApprovalWorkflowService(
    repository as never,
    eventBus as never,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    repository.findApprovalWorkflowDefinition.mockResolvedValue({
      id: "workflow-id",
      entity_type: "purchase_requisition",
    });
    repository.findApprovalRequestByEntity.mockResolvedValue(null);
    repository.findRequisitionById.mockResolvedValue({
      id: "requisition-id",
      tenant_id: "tenant-id",
      company_id: "company-id",
      total_amount: new Decimal("139800"),
    });
    repository.getLevels.mockResolvedValue([
      {
        id: "level-id",
        level_no: 1,
        role_id: "role-id",
        min_amount: new Decimal("0"),
        max_amount: new Decimal("200000"),
      },
    ]);
    repository.createApprovalRequest.mockResolvedValue({
      id: "approval-request-id",
    });
  });

  it("creates a pending request when the requisition amount is within the level range", async () => {
    await service.createApprovalRequest({
      purchaseRequisitionId: "requisition-id",
      tenantId: "tenant-id",
      companyId: "company-id",
      userId: "requester-id",
      workflowCode: "PR_SOMETHING",
      entityType: "purchase_requisition",
      submitted_At: new Date("2026-10-24T08:52:45.413Z"),
    });

    expect(repository.createApprovalRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_id: "requisition-id",
        current_level: 1,
        status: "PENDING",
      }),
    );
  });

  it("does not create a request when no level contains the requisition amount", async () => {
    repository.getLevels.mockResolvedValue([
      {
        id: "level-id",
        level_no: 1,
        role_id: "role-id",
        min_amount: new Decimal("0"),
        max_amount: new Decimal("0"),
      },
    ]);

    await expect(
      service.createApprovalRequest({
        purchaseRequisitionId: "requisition-id",
        tenantId: "tenant-id",
        companyId: "company-id",
        userId: "requester-id",
        workflowCode: "PR_SOMETHING",
        entityType: "purchase_requisition",
        submitted_At: new Date("2026-10-24T08:52:45.413Z"),
      }),
    ).rejects.toThrow(
      "No approval level matches the purchase requisition amount",
    );

    expect(repository.createApprovalRequest).not.toHaveBeenCalled();
  });
});
