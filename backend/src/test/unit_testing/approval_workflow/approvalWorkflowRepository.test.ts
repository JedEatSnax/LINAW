import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    approvalAction: {
      create: vi.fn(),
    },
    approvalRequest: {
      update: vi.fn(),
    },
    purchaseRequisition: {
      updateMany: vi.fn(),
    },
    role: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("../../../config/database.js", () => ({
  prisma: prismaMock,
}));

import { ApprovalWorkflowRepository } from "../../../modules/approval_workflow/approvalWorkflowRepository.js";

describe("ApprovalWorkflowRepository.findRoleByCodeAndTenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback(prismaMock),
    );
  });

  it("updates the approved requisition in the same decision transaction", async () => {
    const approvalRequest = { id: "approval-request-id", status: "APPROVED" };
    prismaMock.approvalAction.create.mockResolvedValue({ id: "action-id" });
    prismaMock.approvalRequest.update.mockResolvedValue(approvalRequest);
    prismaMock.purchaseRequisition.updateMany.mockResolvedValue({ count: 1 });

    const result = await new ApprovalWorkflowRepository().recordDecision({
      action: {
        level_id: "level-id",
        tenant_id: "tenant-id",
        approval_request_id: "approval-request-id",
        acted_by_user_id: "user-id",
        action: "APPROVED",
        remarks: null,
        acted_at: new Date("2026-10-24T10:00:00.000Z"),
      },
      request: {
        approvalWorkflow_id: "approval-request-id",
        purchaseRequisition_id: "requisition-id",
        tenant_id: "tenant-id",
        company_id: "company-id",
        status: "APPROVED",
        resolved_at: new Date("2026-10-24T10:00:00.000Z"),
      },
    });

    expect(result).toBe(approvalRequest);
    expect(prismaMock.purchaseRequisition.updateMany).toHaveBeenCalledWith({
      where: {
        id: "requisition-id",
        tenant_id: "tenant-id",
        company_id: "company-id",
      },
      data: {
        status: "APPROVED",
        approved_at: new Date("2026-10-24T10:00:00.000Z"),
      },
    });
  });

  it("updates the rejected requisition using the requisition ID and scope", async () => {
    const rejection = { id: "approval-request-id", status: "REJECTED" };
    const rejectedAt = new Date("2026-10-24T10:05:00.000Z");
    prismaMock.approvalAction.create.mockResolvedValue({ id: "action-id" });
    prismaMock.approvalRequest.update.mockResolvedValue(rejection);
    prismaMock.purchaseRequisition.updateMany.mockResolvedValue({ count: 1 });

    await new ApprovalWorkflowRepository().recordDecision({
      action: {
        level_id: "level-id",
        tenant_id: "tenant-id",
        approval_request_id: "approval-request-id",
        acted_by_user_id: "user-id",
        action: "REJECTED",
        remarks: "Insufficient justification",
        acted_at: rejectedAt,
      },
      request: {
        approvalWorkflow_id: "approval-request-id",
        purchaseRequisition_id: "requisition-id",
        tenant_id: "tenant-id",
        company_id: "company-id",
        status: "REJECTED",
        resolved_at: rejectedAt,
      },
    });

    expect(prismaMock.purchaseRequisition.updateMany).toHaveBeenCalledWith({
      where: {
        id: "requisition-id",
        tenant_id: "tenant-id",
        company_id: "company-id",
      },
      data: {
        status: "REJECTED",
        rejected_at: rejectedAt,
      },
    });
  });

  it("fails the decision transaction when the requisition is not updated", async () => {
    prismaMock.approvalAction.create.mockResolvedValue({ id: "action-id" });
    prismaMock.approvalRequest.update.mockResolvedValue({
      id: "approval-request-id",
    });
    prismaMock.purchaseRequisition.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      new ApprovalWorkflowRepository().recordDecision({
        action: {
          level_id: "level-id",
          tenant_id: "tenant-id",
          approval_request_id: "approval-request-id",
          acted_by_user_id: "user-id",
          action: "REJECTED",
          remarks: null,
          acted_at: new Date("2026-10-24T10:05:00.000Z"),
        },
        request: {
          approvalWorkflow_id: "approval-request-id",
          purchaseRequisition_id: "requisition-id",
          tenant_id: "tenant-id",
          company_id: "company-id",
          status: "REJECTED",
          resolved_at: new Date("2026-10-24T10:05:00.000Z"),
        },
      }),
    ).rejects.toThrow("Purchase requisition decision could not be updated");
  });

  it("resolves a role scoped to the active company", async () => {
    const role = { id: "role-id", code: "finance_manager" };
    prismaMock.role.findFirst.mockResolvedValue(role);

    const result =
      await new ApprovalWorkflowRepository().findRoleByCodeAndTenant(
        "finance_manager",
        "tenant-id",
        "company-id",
      );

    expect(result).toBe(role);
    expect(prismaMock.role.findFirst).toHaveBeenCalledWith({
      where: {
        code: "finance_manager",
        OR: [
          {
            tenant_id: "tenant-id",
            company_id: "company-id",
          },
          {
            tenant_id: null,
            company_id: null,
            is_system: true,
          },
        ],
      },
    });
  });

  it("uses the global system-role scope as the supported fallback", async () => {
    prismaMock.role.findFirst.mockResolvedValue({
      id: "system-role-id",
      code: "PROCUREMENT_OFFICER",
      is_system: true,
    });

    const result =
      await new ApprovalWorkflowRepository().findRoleByCodeAndTenant(
        "PROCUREMENT_OFFICER",
        "tenant-id",
        "company-id",
      );

    expect(result?.is_system).toBe(true);
    expect(prismaMock.role.findFirst).toHaveBeenCalledTimes(1);
  });
});
