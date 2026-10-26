import { z } from "zod";
import { CompanyMembershipStatus } from "../../generated/prisma/client";

// ==============
// members
// ==============
export const memberEmailSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const invitationTokenSchema = z.object({
  token: z.string().regex(/^[A-Fa-f0-9]{64}$/, "Invalid invitation token"),
});

export const updateMemberSchema = z
  .object({
    role_id: z.string().uuid().optional(),
    employment_status: z.enum(CompanyMembershipStatus).optional(),
    jobTitle: z.string().trim().min(1).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// ==============
// Role management
// ==============

export const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(100),

  description: z.string().trim().max(500),
});

export const assignRoleSchema = z.object({
  role_id: z.string().uuid(),
});

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()).min(1),
});

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const removePermissionSchema = z.object({
  permission_id: z.string().uuid(),
});

// ==============
// Settings
// ==============

export const updateSettingsSchema = z
  .object({
    companyEmail: z.email().optional(),

    displayName: z.string().trim().min(1).max(150).optional(),

    legalName: z.string().trim().min(1).max(200).optional(),

    contactNumber: z.string().trim().min(1).max(30).optional(),

    address: z.string().trim().min(1).max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// ==============
// Interface
// ==============

export type memberEmail = z.infer<typeof memberEmailSchema>["email"];

export type updateMember = z.infer<typeof updateMemberSchema>;

export type createRole = z.infer<typeof createRoleSchema>;

export type assignRole = z.infer<typeof assignRoleSchema>;

export type assignPermissions = z.infer<typeof assignPermissionsSchema>;

export type updateRole = z.infer<typeof updateRoleSchema>;

export type removePermission = z.infer<typeof removePermissionSchema>;

export type updateSettings = z.infer<typeof updateSettingsSchema>;
