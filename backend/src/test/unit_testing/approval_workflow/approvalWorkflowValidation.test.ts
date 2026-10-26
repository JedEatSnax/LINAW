import { describe, expect, it } from "vitest";
import {
  APPROVAL_WORKFLOW_ID_PARAMS_SCHEMA,
  APPROVAL_WORKFLOW_LEVEL_CREATION,
  APPROVAL_WORKFLOW_QUERY_SCHEMA,
  REJECT_APPROVAL_WORKFLOW_BODY_SCHEMA,
} from "../../../modules/approval_workflow/approvalWorkflowValidator.js";

describe("Approval workflow request validation", () => {
  it("accepts the route parameter used by decision endpoints", () => {
    expect(
      APPROVAL_WORKFLOW_ID_PARAMS_SCHEMA.parse({
        "approval-workflow-id": "approval-request-id",
      }),
    ).toEqual({ approvalWorkflowId: "approval-request-id" });
  });

  it("normalizes status query values for the API", () => {
    expect(APPROVAL_WORKFLOW_QUERY_SCHEMA.parse({ status: "pending" })).toEqual(
      { status: "PENDING" },
    );
  });

  it("allows zero as an amount boundary", () => {
    expect(
      APPROVAL_WORKFLOW_LEVEL_CREATION.parse({
        workflow_code: "PURCHASE_REQUISITION",
        level_no: 1,
        role_code: "MANAGER",
        min_amount: 0,
        max_amount: 1000,
        is_required: true,
      }),
    ).toMatchObject({ minAmount: 0, maxAmount: 1000 });
  });

  it("requires non-empty rejection remarks", () => {
    expect(() =>
      REJECT_APPROVAL_WORKFLOW_BODY_SCHEMA.parse({ remarks: "   " }),
    ).toThrow();
  });
});
