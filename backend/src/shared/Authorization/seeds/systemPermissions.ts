export const systemPermissions = {
  auditTrail: {
    search: "audit_trail:search",
    verify: "audit_trail:verify",
  },

  purchaseRequisition: {
    create: "pr:create",
    cancel: "pr:cancel",
    submit: "pr:submit", // this permission will be used for submit and re-submit endpoint
    update: "pr:update",
    read: "pr:read",
  },

  approvalWorkflow: {
    createLevel: "approval_workflow:create_level",
    createWorkflow: "approval_workflow:create_workflow",
    approve: "approval_workflow:approve",
    reject: "approval_workflow:reject",
    cancel: "approval_workflow:cancel",
    read: "approval_workflow:read",
  },

  organizationManagement: {
    read: "organization:read",
    update: "organization:update",

    inviteMember: "organization_member:invite",
    readMember: "organization_member:read",
    updateMember: "organization_member:update",
    removeMember: "organization_member:remove",

    createRole: "organization_role:create",
    readRole: "organization_role:read",
    updateRole: "organization_role:update",
    deleteRole: "organization_role:delete",

    addRolePermission: "organization_role_permission:add",
    removeRolePermission: "organization_role_permission:remove",
  },

  purchaseOrderManagement: {
    read: "purchase_order:read",

    createRFQ: "purchase_order:create_rfq",
    updateRFQ: "purchase_order:update_rfq",
    deleteRFQ: "purchase_order:delete_rfq",
    cancelRFQ: "purchase_order:cancel_rfq",

    acceptQuotation: "purchase_order:accept_quotation",
    rejectQuotation: "purchase_order:reject_quotation",
    negotiate: "purchase_order:negotiate",
  },

  supplier: {
    read: "supplier:read",
    update: "supplier:update",

    readRFQ: "supplier:read_rfq",
    submitQuotation: "supplier:submit_quotation",
    withdrawQuotation: "supplier:withdraw_quotation",
  },

  supplierManagement: {
    read: "supplier_management:read",

    inviteSupplier: "supplier_management:invite_supplier",

    readSupplier: "supplier_management:read_supplier",
    updateSupplier: "supplier_management:update_supplier",
    removeSupplier: "supplier_management:remove_supplier",
  },
} as const;

export type Permission = {
  [Resource in keyof typeof systemPermissions]: (typeof systemPermissions)[Resource][keyof (typeof systemPermissions)[Resource]];
}[keyof typeof systemPermissions];

export const systemPermissionSeeds = [
  // Audit Trail
  {
    code: "audit_trail:search",
    name: "Search Audit Trail",
    resource: "audit_trail",
    action: "search",
    description: "Allows searching the audit trail.",
  },
  {
    code: "audit_trail:verify",
    name: "Verify Audit Trail",
    resource: "audit_trail",
    action: "verify",
    description: "Allows verifying audit trail records.",
  },

  // Purchase Requisition
  {
    code: "pr:create",
    name: "Create Purchase Requisition",
    resource: "purchase_requisition",
    action: "create",
    description: "Allows creating purchase requisitions.",
  },
  {
    code: "pr:cancel",
    name: "Cancel Purchase Requisition",
    resource: "purchase_requisition",
    action: "cancel",
    description: "Allows cancelling purchase requisitions.",
  },
  {
    code: "pr:submit",
    name: "Submit Purchase Requisition",
    resource: "purchase_requisition",
    action: "submit",
    description: "Allows submitting and re-submitting purchase requisitions.",
  },
  {
    code: "pr:update",
    name: "Update Purchase Requisition",
    resource: "purchase_requisition",
    action: "update",
    description: "Allows updating purchase requisitions.",
  },
  {
    code: "pr:read",
    name: "Read Purchase Requisition",
    resource: "purchase_requisition",
    action: "read",
    description: "Allows viewing purchase requisitions.",
  },

  // Approval Workflow
  {
    code: "approval_workflow:create_level",
    name: "Create Level",
    resource: "approval_workflow",
    action: "create",
    description: "Allows creation of levels",
  },
  {
    code: "approval_workflow:create_workflow",
    name: "Create workflow",
    resource: "approval_workflow",
    action: "create",
    description: "Allow creation of custom workflow definitions ",
  },
  {
    code: "approval_workflow:approve",
    name: "Approve Approval Workflow",
    resource: "approval_workflow",
    action: "approve",
    description: "Allows approving approval workflow requests.",
  },
  {
    code: "approval_workflow:reject",
    name: "Reject Approval Workflow",
    resource: "approval_workflow",
    action: "reject",
    description: "Allows rejecting approval workflow requests.",
  },
  {
    code: "approval_workflow:cancel",
    name: "Cancel Approval Workflow",
    resource: "approval_workflow",
    action: "cancel",
    description: "Allows cancelling approval workflow requests.",
  },
  {
    code: "approval_workflow:read",
    name: "Read Approval Workflow",
    resource: "approval_workflow",
    action: "read",
    description: "Allows viewing approval workflow requests.",
  },

  // Organization Management
  {
    code: "organization:read",
    name: "Read Organization",
    resource: "organization",
    action: "read",
    description: "Allows viewing organization information.",
  },
  {
    code: "organization:update",
    name: "Update Organization",
    resource: "organization",
    action: "update",
    description: "Allows updating organization information.",
  },
  {
    code: "organization_member:invite",
    name: "Invite Organization Member",
    resource: "organization_member",
    action: "invite",
    description: "Allows inviting members to the organization.",
  },
  {
    code: "organization_member:read",
    name: "Read Organization Member",
    resource: "organization_member",
    action: "read",
    description: "Allows viewing organization members.",
  },
  {
    code: "organization_member:update",
    name: "Update Organization Member",
    resource: "organization_member",
    action: "update",
    description: "Allows updating organization member information.",
  },
  {
    code: "organization_member:remove",
    name: "Remove Organization Member",
    resource: "organization_member",
    action: "remove",
    description: "Allows removing members from the organization.",
  },
  {
    code: "organization_role:create",
    name: "Create Organization Role",
    resource: "organization_role",
    action: "create",
    description: "Allows creating organization roles.",
  },
  {
    code: "organization_role:read",
    name: "Read Organization Role",
    resource: "organization_role",
    action: "read",
    description: "Allows viewing organization roles.",
  },
  {
    code: "organization_role:update",
    name: "Update Organization Role",
    resource: "organization_role",
    action: "update",
    description: "Allows updating organization roles.",
  },
  {
    code: "organization_role:delete",
    name: "Delete Organization Role",
    resource: "organization_role",
    action: "delete",
    description: "Allows deleting organization roles.",
  },
  {
    code: "organization_role_permission:add",
    name: "Add Role Permission",
    resource: "organization_role_permission",
    action: "add",
    description: "Allows adding permissions to organization roles.",
  },
  {
    code: "organization_role_permission:remove",
    name: "Remove Role Permission",
    resource: "organization_role_permission",
    action: "remove",
    description: "Allows removing permissions from organization roles.",
  },

  // Purchase Order Management
  {
    code: "purchase_order:read",
    name: "Read Purchase Order",
    resource: "purchase_order",
    action: "read",
    description: "Allows viewing purchase orders.",
  },
  {
    code: "purchase_order:create_rfq",
    name: "Create RFQ",
    resource: "purchase_order",
    action: "create_rfq",
    description: "Allows creating requests for quotation.",
  },
  {
    code: "purchase_order:update_rfq",
    name: "Update RFQ",
    resource: "purchase_order",
    action: "update_rfq",
    description: "Allows updating requests for quotation.",
  },
  {
    code: "purchase_order:delete_rfq",
    name: "Delete RFQ",
    resource: "purchase_order",
    action: "delete_rfq",
    description: "Allows deleting requests for quotation.",
  },
  {
    code: "purchase_order:cancel_rfq",
    name: "Cancel RFQ",
    resource: "purchase_order",
    action: "cancel_rfq",
    description: "Allows cancelling requests for quotation.",
  },
  {
    code: "purchase_order:accept_quotation",
    name: "Accept Quotation",
    resource: "purchase_order",
    action: "accept_quotation",
    description: "Allows accepting supplier quotations.",
  },
  {
    code: "purchase_order:reject_quotation",
    name: "Reject Quotation",
    resource: "purchase_order",
    action: "reject_quotation",
    description: "Allows rejecting supplier quotations.",
  },
  {
    code: "purchase_order:negotiate",
    name: "Negotiate Quotation",
    resource: "purchase_order",
    action: "negotiate",
    description: "Allows negotiating supplier quotations.",
  },

  // Supplier Dashboard
  {
    code: "supplier:read",
    name: "Read Supplier Dashboard",
    resource: "supplier",
    action: "read",
    description: "Allows accessing and viewing the supplier dashboard.",
  },
  {
    code: "supplier:update",
    name: "Update Supplier",
    resource: "supplier",
    action: "update",
    description: "Allows updating supplier information.",
  },
  {
    code: "supplier:read_rfq",
    name: "Read Supplier RFQ",
    resource: "supplier",
    action: "read_rfq",
    description: "Allows viewing RFQs received from organizations.",
  },
  {
    code: "supplier:submit_quotation",
    name: "Submit Quotation",
    resource: "supplier",
    action: "submit_quotation",
    description: "Allows submitting quotations for received RFQs.",
  },
  {
    code: "supplier:withdraw_quotation",
    name: "Withdraw Quotation",
    resource: "supplier",
    action: "withdraw_quotation",
    description: "Allows withdrawing submitted quotations.",
  },

  // Supplier Management
  {
    code: "supplier_management:read",
    name: "Read Supplier Management",
    resource: "supplier_management",
    action: "read",
    description: "Allows accessing and viewing supplier management.",
  },
  {
    code: "supplier_management:invite_supplier",
    name: "Invite Supplier",
    resource: "supplier_management",
    action: "invite_supplier",
    description: "Allows inviting companies to become suppliers.",
  },
  {
    code: "supplier_management:read_supplier",
    name: "Read Supplier",
    resource: "supplier_management",
    action: "read_supplier",
    description: "Allows viewing supplier information and relationships.",
  },
  {
    code: "supplier_management:update_supplier",
    name: "Update Supplier",
    resource: "supplier_management",
    action: "update_supplier",
    description: "Allows updating supplier information and relationships.",
  },
  {
    code: "supplier_management:remove_supplier",
    name: "Remove Supplier",
    resource: "supplier_management",
    action: "remove_supplier",
    description:
      "Allows removing suppliers from the organization's supplier relationships.",
  },
] as const;
