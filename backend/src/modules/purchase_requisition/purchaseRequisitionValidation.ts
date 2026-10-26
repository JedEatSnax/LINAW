import { z } from "zod";
import {
  currencyCodeSchema,
  DEFAULT_CURRENCY_CODE,
  hasCurrencyPrecision,
} from "../../shared/currency.js";

// ===========================
// Shared Schemas
// ===========================

export const purchaseRequisitionIdParamsSchema = z.object({
  requisitionId: z.string(),
});

// ===========================
// Domain Values
// ===========================

// Replace these values with the actual values used by your application.
export const purchaseRequisitionPrioritySchema = z.enum([
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

// Replace these values with the actual values used by your application.
export const purchaseRequisitionItemTypeSchema = z.enum([
  "GOODS",
  "SERVICE",
  "ASSET",
]);

export const purchaseRequisitionStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

// ===========================
// Decimal Validation
// ===========================

// Prisma:
// Decimal(18, 4)
const quantitySchema = z
  .number()
  .finite("Quantity must be a valid number.")
  .positive("Quantity must be greater than zero.")
  .refine(
    (value: number) => Number.isInteger(value * 10_000),
    "Quantity cannot have more than 4 decimal places.",
  );

const estimatedUnitCostSchema = z
  .number()
  .finite("Estimated unit cost must be a valid number.")
  .nonnegative("Estimated unit cost cannot be negative.")
  .refine(
    (value: number) => Number.isInteger(value * 10_000),
    "Estimated unit cost cannot have more than 4 decimal places.",
  );

// ===========================
// Purchase Requisition Item
// ===========================

export const purchaseRequisitionItemSchema = z
  .object({
    item_type: purchaseRequisitionItemTypeSchema,

    description: z
      .string()
      .trim()
      .min(1, "Item description is required.")
      .max(255, "Item description cannot exceed 255 characters."),

    specification: z
      .string()
      .trim()
      .max(1000, "Specification cannot exceed 1000 characters."),

    quantity: quantitySchema,

    unit_of_measure: z
      .string()
      .trim()
      .min(1, "Unit of measure is required.")
      .max(50, "Unit of measure cannot exceed 50 characters."),

    estimated_unit_cost: estimatedUnitCostSchema,

    category_id: z.string().uuid("Invalid category ID format.").optional(),

    needed_by_date: z
      .string()
      .date("Invalid needed-by date format.")
      .optional(),
  })
  .strict();

// ===========================
// Purchase Requisition Input
// ===========================

export const purchaseRequisitionInputSchema = z
  .object({
    workflow_code: z
      .string()
      .trim()
      .min(1, "Approval workflow is required.")
      .max(100),
    purpose: z
      .string()
      .trim()
      .max(500, "Purpose cannot exceed 500 characters.")
      .optional()
      .default(""),

    justification: z
      .string()
      .trim()
      .min(10, "Justification must be at least 10 characters.")
      .max(500, "Justification cannot exceed 500 characters."),

    priority: purchaseRequisitionPrioritySchema.optional().default("NORMAL"),

    currency_code: currencyCodeSchema.optional().default(DEFAULT_CURRENCY_CODE),

    needed_by_date: z
      .string()
      .date("Invalid needed-by date format.")
      .optional(),

    items: z.array(purchaseRequisitionItemSchema).optional(),

    line_items: z.array(purchaseRequisitionItemSchema).optional(),

    requisition_number: z.string().optional(),
    requester_id: z.string().optional(),
    company_id: z.string().optional(),
    request_date: z.string().date().optional(),
    requisition_status: purchaseRequisitionStatusSchema.optional(),
    total_estimated_amount: z.number().nonnegative().optional(),
    created_by: z.string().optional(),
    submitted_at: z.string().datetime().optional(),

    remarks: z
      .string()
      .trim()
      .max(500, "Remarks cannot exceed 500 characters.")
      .optional(),
  })
  .strict()
  .transform((value) => ({
    ...value,
    items: value.items ?? value.line_items ?? [],
  }))
  .refine((value) => value.items.length > 0, {
    message: "At least one line item is required.",
    path: ["line_items"],
  })
  .superRefine((value, context) => {
    value.items.forEach((item, index) => {
      if (
        !hasCurrencyPrecision(item.estimated_unit_cost, value.currency_code)
      ) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "estimated_unit_cost"],
          message: `Estimated unit cost does not match ${value.currency_code} minor-unit precision.`,
        });
      }
    });
  });

// ===========================
// Update Schema
// ===========================

export const updatePurchaseRequisitionSchema = z
  .object({
    purpose: z.string().trim().max(500).optional(),

    justification: z.string().trim().min(10).max(500).optional(),

    priority: purchaseRequisitionPrioritySchema.optional(),

    needed_by_date: z
      .string()
      .date("Invalid needed-by date format.")
      .optional(),

    request_date: z.string().date("Invalid request date format.").optional(),

    items: z.array(purchaseRequisitionItemSchema).optional(),

    line_items: z.array(purchaseRequisitionItemSchema).optional(),

    total_estimated_amount: z.number().nonnegative().optional(),

    remarks: z
      .string()
      .trim()
      .max(500, "Remarks cannot exceed 500 characters.")
      .optional(),
  })
  .strict()
  .transform((value) => ({
    ...value,
    needed_by_date: value.needed_by_date ?? value.request_date,
    items: value.items ?? value.line_items,
  }));

export const PurchaseRequisitionStatusSchema = z.object({
  status: purchaseRequisitionStatusSchema,
});

export const cancelPurchaseRequisitionSchema = z
  .object({
    remarks: z
      .string()
      .trim()
      .max(500, "Cancellation remarks cannot exceed 500 characters."),
  })
  .strict();

// ===========================
// Query Schema
// ===========================

export const PurchaseRequisitionQuerySchema = z
  .object({
    status: purchaseRequisitionStatusSchema.optional(),

    requesterId: z.string().uuid().optional(),

    pr_number: z.string().trim().min(1).optional(),

    referenceNo: z.string().trim().min(1).optional(),
  })
  .transform((value) => ({
    ...value,
    pr_number: value.pr_number ?? value.referenceNo,
  }));

// ===========================
// Types
// ===========================

export type PurchaseRequisitionQuery = z.infer<
  typeof PurchaseRequisitionQuerySchema
> & {
  userId: string;
  tenantId: string;
  companyId: string;
};

export type PurchaseRequisitionIdParams = z.infer<
  typeof purchaseRequisitionIdParamsSchema
> & {
  userId: string;
  tenantId: string;
  companyId: string;
};

export type PurchaseRequisitionItem = z.infer<
  typeof purchaseRequisitionItemSchema
>;

export type PurchaseRequisitionInput = z.infer<
  typeof purchaseRequisitionInputSchema
> & {
  userId: string;
  tenantId: string;
  companyId: string;
};

export type ResubmitPurchaseRequisitionInput = z.infer<
  typeof purchaseRequisitionInputSchema
> & {
  userId: string;
  requisitionId: string;
  tenantId: string;
  companyId: string;
};

export type PurchaseRequisitionUpdateData = z.infer<
  typeof updatePurchaseRequisitionSchema
>;

export type PurchaseRequisitionUpdate = z.infer<
  typeof updatePurchaseRequisitionSchema
>;

export type PurchaseRequisitionStatusUpdate = z.infer<
  typeof PurchaseRequisitionStatusSchema
>;

export type CancelPurchaseRequisitionInput = z.infer<
  typeof cancelPurchaseRequisitionSchema
> & {
  requisitionId: string;
  userId: string;
  tenantId: string;
  companyId: string;
};
