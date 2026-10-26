import { z } from "zod";

// ===========================
// getSchema
// ===========================

export const GET_SCHEMA = z.object({
  user_id: z.string(),
});

// ===========================
// approvalWorkflowIdParamsSchema
// ===========================

export const APPROVAL_WORKFLOW_ID_PARAMS_SCHEMA = z
  .object({
    "approval-workflow-id": z.string(),
  })
  .transform(({ "approval-workflow-id": approvalWorkflowId }) => ({
    approvalWorkflowId,
  }));

// ===========================
// approvalWorkflowQuerySchema
// ===========================

export const APPROVAL_WORKFLOW_QUERY_SCHEMA = z.object({
  status: z
    .preprocess(
      (value) => (typeof value === "string" ? value.toUpperCase() : value),
      z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]),
    )
    .optional(),
});

// ===========================
// rejectApprovalWorkflowBodySchema
// ===========================

export const REJECT_APPROVAL_WORKFLOW_BODY_SCHEMA = z.object({
  remarks: z
    .string()
    .trim()
    .min(1, "Rejection remarks are required.")
    .max(1000),
});

// ===========================
// ApprovalWorkflowLevelCreation
// ===========================

export const APPROVAL_WORKFLOW_LEVEL_CREATION = z
  .object({
    workflow_code: z.string(),

    level_no: z.number().int().positive(),

    role_code: z.string(),

    min_amount: z.number().nonnegative(),

    max_amount: z.number().nonnegative(),

    is_required: z.boolean(),
  })
  .transform(
    ({
      workflow_code,
      level_no,
      role_code,
      min_amount,
      max_amount,
      is_required,
    }) => ({
      workflowCode: workflow_code,
      levelNo: level_no,
      roleCode: role_code,
      minAmount: min_amount,
      maxAmount: max_amount,
      isRequired: is_required,
    }),
  );

// ===========================
//  ApprovalWorkflowCode
// ===========================

export const APPROVAL_WORKFLOW_CREATION = z
  .object({
    workflow_code: z
      .string()
      .trim()
      .min(1, "Workflow code is required.")
      .max(100)
      .regex(
        /^[A-Z0-9_]+$/,
        "Workflow code must contain only uppercase letters, numbers, and underscores.",
      ),

    name: z.string().trim().min(1, "Workflow name is required.").max(150),

    description: z.string().trim().max(1000).optional(),

    entity_type: z.string().trim().min(1, "Entity type is required.").max(100),
  })
  .transform(({ workflow_code, name, description, entity_type }) => ({
    workflowCode: workflow_code,
    name,
    description,
    entityType: entity_type,
  }));

// ===========================
// Interface types
// ===========================

export type ApprovalWorkflowIdParams = z.infer<
  typeof APPROVAL_WORKFLOW_ID_PARAMS_SCHEMA
>;

export type ApprovalWorkflowQuery = z.infer<
  typeof APPROVAL_WORKFLOW_QUERY_SCHEMA
> & {
  userId: string;
};

export type RejectApprovalWorkflowBody = z.infer<
  typeof REJECT_APPROVAL_WORKFLOW_BODY_SCHEMA
>;

export type CreateLevels = z.infer<typeof APPROVAL_WORKFLOW_LEVEL_CREATION> & {
  userId: string;
};

export type CreateWorkflow = z.infer<typeof APPROVAL_WORKFLOW_CREATION> & {
  userId: string;
};
