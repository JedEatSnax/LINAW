import { z } from "zod";

// =============
// Email Schema
// =============

export const InvitationEmailSchema = z
  .string()
  .trim()
  .email("Invalid email address.")
  .max(254, "Email address is too long.")
  .toLowerCase();

// =============
// Invitation ID Schema
// =============

export const InvitationIdSchema = z.object({
  invitationId: z.uuid("Invalid invitation ID."),
});

// =============
// Invitation Token Schema
// =============

export const InvitationTokenSchema = z.object({
  token: z
    .string()
    .min(32, "Invalid invitation token.")
    .max(512, "Invalid invitation token.")
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid invitation token format."),
});

// =============
// Invitation Query Schema
// =============

export const InvitationQuerySchema = z.object({
  status: z.string().trim().min(1).max(32).optional(),
  email: InvitationEmailSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// =============
// Create Invitation Schema
// =============

export const CreateSupplierInvitationSchema = z.object({
  email: InvitationEmailSchema,
});

export const AcceptSupplierInvitationSchema = z.object({
  token: InvitationTokenSchema.shape.token,
  company_id: z.uuid("Invalid company ID.").optional(),
});

// =============
// Interface
// =============

export type CreateSupplierInvitation = z.infer<
  typeof CreateSupplierInvitationSchema
>;

export type Email = z.infer<typeof InvitationEmailSchema>;
