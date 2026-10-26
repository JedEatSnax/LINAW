import { systemPermissionSeeds } from "./systemPermissions.js";

export const systemRolePermissions = {
  ORGANIZATION_ADMIN: systemPermissionSeeds.map(
    (permission) => permission.code,
  ),

  EMPLOYEE: ["pr:create", "pr:cancel", "pr:submit", "pr:update", "pr:read"],

  PROCUREMENT_OFFICER: [
    "pr:read",
    "pr:update",
    "pr:submit",

    "purchase_order:read",
    "purchase_order:create_rfq",
    "purchase_order:update_rfq",
    "purchase_order:delete_rfq",
    "purchase_order:cancel_rfq",

    "purchase_order:accept_quotation",
    "purchase_order:reject_quotation",
    "purchase_order:negotiate",

    "approval_workflow:create_level",
    "approval_workflow:create_workflow",
    "approval_workflow:approve",
    "approval_workflow:reject",
    "approval_workflow:read",
    "approval_workflow:cancel",

    "supplier_management:read",
    "supplier_management:invite_supplier",
    "supplier_management:read_supplier",
    "supplier_management:update_supplier",
    "supplier_management:remove_supplier",
  ],

  AUDITOR: ["audit_trail:search", "audit_trail:verify"],
} as const;
