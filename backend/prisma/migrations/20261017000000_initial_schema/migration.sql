-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PurchaseRequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseRequisitionPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "ApprovalActionType" AS ENUM ('approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "CompanyMembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "plan" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCredential" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UserCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "tax_id" TEXT,
    "address" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMembership" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_title" TEXT,
    "role_id" UUID,
    "employment_status" TEXT,
    "department" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyInvitation" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "invite_token_hash" TEXT NOT NULL,
    "invited_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ(6),

    CONSTRAINT "CompanyInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "company_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "company_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisition" (
    "id" UUID NOT NULL,
    "root_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "pr_number" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "requested_by_user_id" UUID NOT NULL,
    "purpose" TEXT,
    "justification" TEXT,
    "status" "PurchaseRequisitionStatus" NOT NULL,
    "priority" "PurchaseRequisitionPriority",
    "currency_code" TEXT NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "needed_by_date" DATE,
    "submitted_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisitionItem" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "purchase_requisition_id" UUID NOT NULL,
    "line_no" INTEGER NOT NULL,
    "item_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specification" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "estimated_unit_cost" DECIMAL(18,2) NOT NULL,
    "estimated_total_cost" DECIMAL(18,2) NOT NULL,
    "category_id" UUID,
    "needed_by_date" DATE,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PurchaseRequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisitionStatusLog" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "purchase_requisition_id" UUID NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "acted_by_user_id" UUID NOT NULL,
    "remarks" TEXT,
    "acted_at" TIMESTAMPTZ(6) NOT NULL,
    "metadata_json" JSONB,

    CONSTRAINT "PurchaseRequisitionStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "requester_user_id" UUID NOT NULL,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL,
    "submitted_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflowLevel" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID,
    "workflow_id" UUID NOT NULL,
    "level_no" INTEGER NOT NULL,
    "role_id" UUID NOT NULL,
    "min_amount" DECIMAL(18,2),
    "max_amount" DECIMAL(18,2),
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ApprovalWorkflowLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflowDefinition" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "company_id" UUID,
    "workflow_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entity_type" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ApprovalWorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalAction" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "approval_request_id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "acted_by_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "remarks" TEXT,
    "acted_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvitation" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "invited_by_user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT,
    "status" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SupplierInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierCompanyRelationship" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "relationship_status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SupplierCompanyRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "rfq_number" TEXT NOT NULL,
    "purchase_requisition_id" UUID,
    "created_by_user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "issue_date" DATE,
    "closing_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQItem" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "rfq_id" UUID NOT NULL,
    "purchase_requisition_item_id" UUID,
    "line_no" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "specification" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RFQItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQSupplierAssignment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "rfq_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RFQSupplierAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierQuotation" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "rfq_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "quotation_number" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL,
    "submitted_at" TIMESTAMPTZ(6),
    "valid_until" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SupplierQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierQuotationItem" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_quotation_id" UUID NOT NULL,
    "rfq_item_id" UUID NOT NULL,
    "line_no" INTEGER NOT NULL,
    "quoted_quantity" DECIMAL(18,4) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "total_price" DECIMAL(18,2) NOT NULL,
    "lead_time_days" INTEGER,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SupplierQuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "purchase_requisition_id" UUID,
    "rfq_id" UUID,
    "supplier_quotation_id" UUID,
    "po_number" TEXT NOT NULL,
    "issued_by_user_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "order_date" DATE NOT NULL,
    "expected_delivery_date" DATE,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "source_item_type" TEXT,
    "source_item_id" UUID,
    "line_no" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "total_price" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "received_by_user_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "receipt_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "goods_receipt_id" UUID NOT NULL,
    "purchase_order_item_id" UUID NOT NULL,
    "line_no" INTEGER NOT NULL,
    "received_quantity" DECIMAL(18,4) NOT NULL,
    "accepted_quantity" DECIMAL(18,4) NOT NULL,
    "rejected_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryNotification" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "notified_by_user_id" UUID NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL,
    "notified_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceVerification" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "goods_receipt_id" UUID,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATE NOT NULL,
    "currency_code" TEXT NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "match_status" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL,
    "verified_by_user_id" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "InvoiceVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceVerificationItem" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_verification_id" UUID NOT NULL,
    "purchase_order_item_id" UUID NOT NULL,
    "goods_receipt_item_id" UUID,
    "line_no" INTEGER NOT NULL,
    "invoiced_quantity" DECIMAL(18,4) NOT NULL,
    "invoiced_unit_price" DECIMAL(18,2) NOT NULL,
    "invoiced_total" DECIMAL(18,2) NOT NULL,
    "variance_amount" DECIMAL(18,2),
    "variance_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "InvoiceVerificationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceVerificationAttachment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_verification_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "file_hash" TEXT,
    "uploaded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceVerificationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRequest" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "requested_by_user_id" UUID NOT NULL,
    "report_type" TEXT NOT NULL,
    "parameters_json" JSONB,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "ReportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExport" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "report_request_id" UUID NOT NULL,
    "format" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "file_hash" TEXT,
    "generated_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditTrail" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT,
    "request_id" TEXT,
    "snapshot_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditTrailHash" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "audit_trail_id" UUID NOT NULL,
    "hash_algorithm" TEXT NOT NULL,
    "hash_value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditTrailHash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditTrailBlockchainRef" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "audit_trail_id" UUID NOT NULL,
    "network_ref" TEXT,
    "blockchain_transaction_hash" TEXT NOT NULL,
    "block_number" BIGINT,
    "anchored_at" TIMESTAMPTZ(6),

    CONSTRAINT "AuditTrailBlockchainRef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "User_tenant_id_idx" ON "User"("tenant_id");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenant_id_email_key" ON "User"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredential_user_id_key" ON "UserCredential"("user_id");

-- CreateIndex
CREATE INDEX "Company_tenant_id_idx" ON "Company"("tenant_id");

-- CreateIndex
CREATE INDEX "CompanyMembership_tenant_id_idx" ON "CompanyMembership"("tenant_id");

-- CreateIndex
CREATE INDEX "CompanyMembership_employment_status_idx" ON "CompanyMembership"("employment_status");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMembership_tenant_id_company_id_user_id_key" ON "CompanyMembership"("tenant_id", "company_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInvitation_invite_token_hash_key" ON "CompanyInvitation"("invite_token_hash");

-- CreateIndex
CREATE INDEX "CompanyInvitation_tenant_id_idx" ON "CompanyInvitation"("tenant_id");

-- CreateIndex
CREATE INDEX "CompanyInvitation_company_id_idx" ON "CompanyInvitation"("company_id");

-- CreateIndex
CREATE INDEX "CompanyInvitation_email_idx" ON "CompanyInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refresh_token_hash_key" ON "UserSession"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "UserSession_tenant_id_idx" ON "UserSession"("tenant_id");

-- CreateIndex
CREATE INDEX "UserSession_user_id_idx" ON "UserSession"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "RefreshToken"("token_hash");

-- CreateIndex
CREATE INDEX "RefreshToken_tenant_id_idx" ON "RefreshToken"("tenant_id");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_hash_key" ON "PasswordResetToken"("token_hash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tenant_id_idx" ON "PasswordResetToken"("tenant_id");

-- CreateIndex
CREATE INDEX "PasswordResetToken_user_id_idx" ON "PasswordResetToken"("user_id");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expires_at_idx" ON "PasswordResetToken"("expires_at");

-- CreateIndex
CREATE INDEX "Role_tenant_id_idx" ON "Role"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "Role_tenant_id_code_key" ON "Role"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");

-- CreateIndex
CREATE INDEX "Permission_action_idx" ON "Permission"("action");

-- CreateIndex
CREATE INDEX "RolePermission_role_id_idx" ON "RolePermission"("role_id");

-- CreateIndex
CREATE INDEX "RolePermission_permission_id_idx" ON "RolePermission"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_id_permission_id_key" ON "RolePermission"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "UserRole_tenant_id_idx" ON "UserRole"("tenant_id");

-- CreateIndex
CREATE INDEX "UserRole_user_id_idx" ON "UserRole"("user_id");

-- CreateIndex
CREATE INDEX "UserRole_role_id_idx" ON "UserRole"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_tenant_id_user_id_role_id_company_id_key" ON "UserRole"("tenant_id", "user_id", "role_id", "company_id");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_tenant_id_idx" ON "PurchaseRequisition"("tenant_id");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_company_id_idx" ON "PurchaseRequisition"("company_id");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_status_idx" ON "PurchaseRequisition"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_root_id_idx" ON "PurchaseRequisition"("root_id");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_tenant_id_pr_number_key" ON "PurchaseRequisition"("tenant_id", "pr_number");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_tenant_id_idx" ON "PurchaseRequisitionItem"("tenant_id");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_purchase_requisition_id_idx" ON "PurchaseRequisitionItem"("purchase_requisition_id");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_item_type_idx" ON "PurchaseRequisitionItem"("item_type");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_status_idx" ON "PurchaseRequisitionItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisitionItem_purchase_requisition_id_line_no_key" ON "PurchaseRequisitionItem"("purchase_requisition_id", "line_no");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionStatusLog_tenant_id_idx" ON "PurchaseRequisitionStatusLog"("tenant_id");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionStatusLog_purchase_requisition_id_idx" ON "PurchaseRequisitionStatusLog"("purchase_requisition_id");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionStatusLog_action_idx" ON "PurchaseRequisitionStatusLog"("action");

-- CreateIndex
CREATE INDEX "ApprovalRequest_tenant_id_idx" ON "ApprovalRequest"("tenant_id");

-- CreateIndex
CREATE INDEX "ApprovalRequest_company_id_idx" ON "ApprovalRequest"("company_id");

-- CreateIndex
CREATE INDEX "ApprovalRequest_entity_type_idx" ON "ApprovalRequest"("entity_type");

-- CreateIndex
CREATE INDEX "ApprovalRequest_entity_id_idx" ON "ApprovalRequest"("entity_id");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowLevel_tenant_id_idx" ON "ApprovalWorkflowLevel"("tenant_id");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowLevel_workflow_id_idx" ON "ApprovalWorkflowLevel"("workflow_id");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowLevel_role_id_idx" ON "ApprovalWorkflowLevel"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalWorkflowLevel_workflow_id_level_no_key" ON "ApprovalWorkflowLevel"("workflow_id", "level_no");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowDefinition_tenant_id_idx" ON "ApprovalWorkflowDefinition"("tenant_id");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowDefinition_workflow_code_idx" ON "ApprovalWorkflowDefinition"("workflow_code");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalWorkflowDefinition_tenant_id_workflow_code_key" ON "ApprovalWorkflowDefinition"("tenant_id", "workflow_code");

-- CreateIndex
CREATE INDEX "ApprovalAction_tenant_id_idx" ON "ApprovalAction"("tenant_id");

-- CreateIndex
CREATE INDEX "ApprovalAction_approval_request_id_idx" ON "ApprovalAction"("approval_request_id");

-- CreateIndex
CREATE INDEX "ApprovalAction_level_id_idx" ON "ApprovalAction"("level_id");

-- CreateIndex
CREATE INDEX "ApprovalAction_action_idx" ON "ApprovalAction"("action");

-- CreateIndex
CREATE INDEX "Supplier_tenant_id_idx" ON "Supplier"("tenant_id");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_tenant_id_supplier_code_key" ON "Supplier"("tenant_id", "supplier_code");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvitation_token_hash_key" ON "SupplierInvitation"("token_hash");

-- CreateIndex
CREATE INDEX "SupplierInvitation_tenant_id_idx" ON "SupplierInvitation"("tenant_id");

-- CreateIndex
CREATE INDEX "SupplierInvitation_company_id_idx" ON "SupplierInvitation"("company_id");

-- CreateIndex
CREATE INDEX "SupplierInvitation_status_idx" ON "SupplierInvitation"("status");

-- CreateIndex
CREATE INDEX "SupplierCompanyRelationship_tenant_id_idx" ON "SupplierCompanyRelationship"("tenant_id");

-- CreateIndex
CREATE INDEX "SupplierCompanyRelationship_company_id_idx" ON "SupplierCompanyRelationship"("company_id");

-- CreateIndex
CREATE INDEX "SupplierCompanyRelationship_supplier_id_idx" ON "SupplierCompanyRelationship"("supplier_id");

-- CreateIndex
CREATE INDEX "SupplierCompanyRelationship_relationship_status_idx" ON "SupplierCompanyRelationship"("relationship_status");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierCompanyRelationship_tenant_id_company_id_supplier_i_key" ON "SupplierCompanyRelationship"("tenant_id", "company_id", "supplier_id");

-- CreateIndex
CREATE INDEX "RFQ_tenant_id_idx" ON "RFQ"("tenant_id");

-- CreateIndex
CREATE INDEX "RFQ_company_id_idx" ON "RFQ"("company_id");

-- CreateIndex
CREATE INDEX "RFQ_status_idx" ON "RFQ"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RFQ_id_tenant_id_rfq_number_key" ON "RFQ"("id", "tenant_id", "rfq_number");

-- CreateIndex
CREATE INDEX "RFQItem_tenant_id_idx" ON "RFQItem"("tenant_id");

-- CreateIndex
CREATE INDEX "RFQItem_rfq_id_idx" ON "RFQItem"("rfq_id");

-- CreateIndex
CREATE UNIQUE INDEX "RFQItem_rfq_id_line_no_key" ON "RFQItem"("rfq_id", "line_no");

-- CreateIndex
CREATE INDEX "RFQSupplierAssignment_tenant_id_idx" ON "RFQSupplierAssignment"("tenant_id");

-- CreateIndex
CREATE INDEX "RFQSupplierAssignment_company_id_idx" ON "RFQSupplierAssignment"("company_id");

-- CreateIndex
CREATE INDEX "RFQSupplierAssignment_rfq_id_idx" ON "RFQSupplierAssignment"("rfq_id");

-- CreateIndex
CREATE INDEX "RFQSupplierAssignment_supplier_id_idx" ON "RFQSupplierAssignment"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "RFQSupplierAssignment_rfq_id_supplier_id_key" ON "RFQSupplierAssignment"("rfq_id", "supplier_id");

-- CreateIndex
CREATE INDEX "SupplierQuotation_tenant_id_idx" ON "SupplierQuotation"("tenant_id");

-- CreateIndex
CREATE INDEX "SupplierQuotation_company_id_idx" ON "SupplierQuotation"("company_id");

-- CreateIndex
CREATE INDEX "SupplierQuotation_rfq_id_idx" ON "SupplierQuotation"("rfq_id");

-- CreateIndex
CREATE INDEX "SupplierQuotation_supplier_id_idx" ON "SupplierQuotation"("supplier_id");

-- CreateIndex
CREATE INDEX "SupplierQuotation_status_idx" ON "SupplierQuotation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierQuotation_tenant_id_quotation_number_key" ON "SupplierQuotation"("tenant_id", "quotation_number");

-- CreateIndex
CREATE INDEX "SupplierQuotationItem_tenant_id_idx" ON "SupplierQuotationItem"("tenant_id");

-- CreateIndex
CREATE INDEX "SupplierQuotationItem_company_id_idx" ON "SupplierQuotationItem"("company_id");

-- CreateIndex
CREATE INDEX "SupplierQuotationItem_supplier_quotation_id_idx" ON "SupplierQuotationItem"("supplier_quotation_id");

-- CreateIndex
CREATE INDEX "SupplierQuotationItem_rfq_item_id_idx" ON "SupplierQuotationItem"("rfq_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierQuotationItem_supplier_quotation_id_line_no_key" ON "SupplierQuotationItem"("supplier_quotation_id", "line_no");

-- CreateIndex
CREATE INDEX "PurchaseOrder_tenant_id_idx" ON "PurchaseOrder"("tenant_id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_company_id_idx" ON "PurchaseOrder"("company_id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplier_id_idx" ON "PurchaseOrder"("supplier_id");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_tenant_id_po_number_key" ON "PurchaseOrder"("tenant_id", "po_number");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_tenant_id_idx" ON "PurchaseOrderItem"("tenant_id");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchase_order_id_idx" ON "PurchaseOrderItem"("purchase_order_id");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_status_idx" ON "PurchaseOrderItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderItem_purchase_order_id_line_no_key" ON "PurchaseOrderItem"("purchase_order_id", "line_no");

-- CreateIndex
CREATE INDEX "GoodsReceipt_tenant_id_idx" ON "GoodsReceipt"("tenant_id");

-- CreateIndex
CREATE INDEX "GoodsReceipt_company_id_idx" ON "GoodsReceipt"("company_id");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchase_order_id_idx" ON "GoodsReceipt"("purchase_order_id");

-- CreateIndex
CREATE INDEX "GoodsReceipt_supplier_id_idx" ON "GoodsReceipt"("supplier_id");

-- CreateIndex
CREATE INDEX "GoodsReceipt_status_idx" ON "GoodsReceipt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_tenant_id_receipt_number_key" ON "GoodsReceipt"("tenant_id", "receipt_number");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_tenant_id_idx" ON "GoodsReceiptItem"("tenant_id");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_goods_receipt_id_idx" ON "GoodsReceiptItem"("goods_receipt_id");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_purchase_order_item_id_idx" ON "GoodsReceiptItem"("purchase_order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceiptItem_goods_receipt_id_line_no_key" ON "GoodsReceiptItem"("goods_receipt_id", "line_no");

-- CreateIndex
CREATE INDEX "DeliveryNotification_tenant_id_idx" ON "DeliveryNotification"("tenant_id");

-- CreateIndex
CREATE INDEX "DeliveryNotification_purchase_order_id_idx" ON "DeliveryNotification"("purchase_order_id");

-- CreateIndex
CREATE INDEX "DeliveryNotification_supplier_id_idx" ON "DeliveryNotification"("supplier_id");

-- CreateIndex
CREATE INDEX "DeliveryNotification_status_idx" ON "DeliveryNotification"("status");

-- CreateIndex
CREATE INDEX "InvoiceVerification_tenant_id_idx" ON "InvoiceVerification"("tenant_id");

-- CreateIndex
CREATE INDEX "InvoiceVerification_company_id_idx" ON "InvoiceVerification"("company_id");

-- CreateIndex
CREATE INDEX "InvoiceVerification_supplier_id_idx" ON "InvoiceVerification"("supplier_id");

-- CreateIndex
CREATE INDEX "InvoiceVerification_purchase_order_id_idx" ON "InvoiceVerification"("purchase_order_id");

-- CreateIndex
CREATE INDEX "InvoiceVerification_invoice_number_idx" ON "InvoiceVerification"("invoice_number");

-- CreateIndex
CREATE INDEX "InvoiceVerification_match_status_idx" ON "InvoiceVerification"("match_status");

-- CreateIndex
CREATE INDEX "InvoiceVerification_verification_status_idx" ON "InvoiceVerification"("verification_status");

-- CreateIndex
CREATE INDEX "InvoiceVerificationItem_tenant_id_idx" ON "InvoiceVerificationItem"("tenant_id");

-- CreateIndex
CREATE INDEX "InvoiceVerificationItem_invoice_verification_id_idx" ON "InvoiceVerificationItem"("invoice_verification_id");

-- CreateIndex
CREATE INDEX "InvoiceVerificationItem_purchase_order_item_id_idx" ON "InvoiceVerificationItem"("purchase_order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceVerificationItem_invoice_verification_id_line_no_key" ON "InvoiceVerificationItem"("invoice_verification_id", "line_no");

-- CreateIndex
CREATE INDEX "InvoiceVerificationAttachment_tenant_id_idx" ON "InvoiceVerificationAttachment"("tenant_id");

-- CreateIndex
CREATE INDEX "InvoiceVerificationAttachment_invoice_verification_id_idx" ON "InvoiceVerificationAttachment"("invoice_verification_id");

-- CreateIndex
CREATE INDEX "ReportRequest_tenant_id_idx" ON "ReportRequest"("tenant_id");

-- CreateIndex
CREATE INDEX "ReportRequest_report_type_idx" ON "ReportRequest"("report_type");

-- CreateIndex
CREATE INDEX "ReportRequest_status_idx" ON "ReportRequest"("status");

-- CreateIndex
CREATE INDEX "ReportExport_tenant_id_idx" ON "ReportExport"("tenant_id");

-- CreateIndex
CREATE INDEX "ReportExport_report_request_id_idx" ON "ReportExport"("report_request_id");

-- CreateIndex
CREATE INDEX "ReportExport_format_idx" ON "ReportExport"("format");

-- CreateIndex
CREATE INDEX "AuditTrail_tenant_id_idx" ON "AuditTrail"("tenant_id");

-- CreateIndex
CREATE INDEX "AuditTrail_entity_type_idx" ON "AuditTrail"("entity_type");

-- CreateIndex
CREATE INDEX "AuditTrail_entity_id_idx" ON "AuditTrail"("entity_id");

-- CreateIndex
CREATE INDEX "AuditTrail_action_idx" ON "AuditTrail"("action");

-- CreateIndex
CREATE INDEX "AuditTrail_result_idx" ON "AuditTrail"("result");

-- CreateIndex
CREATE UNIQUE INDEX "AuditTrailHash_audit_trail_id_key" ON "AuditTrailHash"("audit_trail_id");

-- CreateIndex
CREATE UNIQUE INDEX "AuditTrailHash_hash_value_key" ON "AuditTrailHash"("hash_value");

-- CreateIndex
CREATE INDEX "AuditTrailHash_tenant_id_idx" ON "AuditTrailHash"("tenant_id");

-- CreateIndex
CREATE INDEX "AuditTrailHash_audit_trail_id_idx" ON "AuditTrailHash"("audit_trail_id");

-- CreateIndex
CREATE UNIQUE INDEX "AuditTrailBlockchainRef_audit_trail_id_key" ON "AuditTrailBlockchainRef"("audit_trail_id");

-- CreateIndex
CREATE INDEX "AuditTrailBlockchainRef_tenant_id_idx" ON "AuditTrailBlockchainRef"("tenant_id");

-- CreateIndex
CREATE INDEX "AuditTrailBlockchainRef_audit_trail_id_idx" ON "AuditTrailBlockchainRef"("audit_trail_id");

-- CreateIndex
CREATE INDEX "AuditTrailBlockchainRef_blockchain_transaction_hash_idx" ON "AuditTrailBlockchainRef"("blockchain_transaction_hash");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCredential" ADD CONSTRAINT "UserCredential_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_purchase_requisition_id_fkey" FOREIGN KEY ("purchase_requisition_id") REFERENCES "PurchaseRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionStatusLog" ADD CONSTRAINT "PurchaseRequisitionStatusLog_acted_by_user_id_fkey" FOREIGN KEY ("acted_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionStatusLog" ADD CONSTRAINT "PurchaseRequisitionStatusLog_purchase_requisition_id_fkey" FOREIGN KEY ("purchase_requisition_id") REFERENCES "PurchaseRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionStatusLog" ADD CONSTRAINT "PurchaseRequisitionStatusLog_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "PurchaseRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowLevel" ADD CONSTRAINT "ApprovalWorkflowLevel_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "ApprovalWorkflowDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowLevel" ADD CONSTRAINT "ApprovalWorkflowLevel_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowLevel" ADD CONSTRAINT "ApprovalWorkflowLevel_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowLevel" ADD CONSTRAINT "ApprovalWorkflowLevel_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowDefinition" ADD CONSTRAINT "ApprovalWorkflowDefinition_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowDefinition" ADD CONSTRAINT "ApprovalWorkflowDefinition_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_acted_by_user_id_fkey" FOREIGN KEY ("acted_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "ApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "ApprovalWorkflowLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvitation" ADD CONSTRAINT "SupplierInvitation_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvitation" ADD CONSTRAINT "SupplierInvitation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvitation" ADD CONSTRAINT "SupplierInvitation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCompanyRelationship" ADD CONSTRAINT "SupplierCompanyRelationship_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCompanyRelationship" ADD CONSTRAINT "SupplierCompanyRelationship_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCompanyRelationship" ADD CONSTRAINT "SupplierCompanyRelationship_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_purchase_requisition_id_fkey" FOREIGN KEY ("purchase_requisition_id") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQItem" ADD CONSTRAINT "RFQItem_purchase_requisition_item_id_fkey" FOREIGN KEY ("purchase_requisition_item_id") REFERENCES "PurchaseRequisitionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQItem" ADD CONSTRAINT "RFQItem_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQItem" ADD CONSTRAINT "RFQItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQSupplierAssignment" ADD CONSTRAINT "RFQSupplierAssignment_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQSupplierAssignment" ADD CONSTRAINT "RFQSupplierAssignment_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQSupplierAssignment" ADD CONSTRAINT "RFQSupplierAssignment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQSupplierAssignment" ADD CONSTRAINT "RFQSupplierAssignment_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotation" ADD CONSTRAINT "SupplierQuotation_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "RFQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotation" ADD CONSTRAINT "SupplierQuotation_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotation" ADD CONSTRAINT "SupplierQuotation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotation" ADD CONSTRAINT "SupplierQuotation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotationItem" ADD CONSTRAINT "SupplierQuotationItem_rfq_item_id_fkey" FOREIGN KEY ("rfq_item_id") REFERENCES "RFQItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotationItem" ADD CONSTRAINT "SupplierQuotationItem_supplier_quotation_id_fkey" FOREIGN KEY ("supplier_quotation_id") REFERENCES "SupplierQuotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotationItem" ADD CONSTRAINT "SupplierQuotationItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierQuotationItem" ADD CONSTRAINT "SupplierQuotationItem_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_issued_by_user_id_fkey" FOREIGN KEY ("issued_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchase_requisition_id_fkey" FOREIGN KEY ("purchase_requisition_id") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplier_quotation_id_fkey" FOREIGN KEY ("supplier_quotation_id") REFERENCES "SupplierQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_received_by_user_id_fkey" FOREIGN KEY ("received_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goods_receipt_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "GoodsReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNotification" ADD CONSTRAINT "DeliveryNotification_notified_by_user_id_fkey" FOREIGN KEY ("notified_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNotification" ADD CONSTRAINT "DeliveryNotification_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNotification" ADD CONSTRAINT "DeliveryNotification_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNotification" ADD CONSTRAINT "DeliveryNotification_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerification" ADD CONSTRAINT "InvoiceVerification_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerification" ADD CONSTRAINT "InvoiceVerification_goods_receipt_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "GoodsReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerification" ADD CONSTRAINT "InvoiceVerification_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerification" ADD CONSTRAINT "InvoiceVerification_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerification" ADD CONSTRAINT "InvoiceVerification_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerification" ADD CONSTRAINT "InvoiceVerification_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerificationItem" ADD CONSTRAINT "InvoiceVerificationItem_goods_receipt_item_id_fkey" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "GoodsReceiptItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerificationItem" ADD CONSTRAINT "InvoiceVerificationItem_invoice_verification_id_fkey" FOREIGN KEY ("invoice_verification_id") REFERENCES "InvoiceVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerificationItem" ADD CONSTRAINT "InvoiceVerificationItem_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerificationItem" ADD CONSTRAINT "InvoiceVerificationItem_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerificationAttachment" ADD CONSTRAINT "InvoiceVerificationAttachment_invoice_verification_id_fkey" FOREIGN KEY ("invoice_verification_id") REFERENCES "InvoiceVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerificationAttachment" ADD CONSTRAINT "InvoiceVerificationAttachment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVerificationAttachment" ADD CONSTRAINT "InvoiceVerificationAttachment_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_generated_by_user_id_fkey" FOREIGN KEY ("generated_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_report_request_id_fkey" FOREIGN KEY ("report_request_id") REFERENCES "ReportRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrail" ADD CONSTRAINT "AuditTrail_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrailHash" ADD CONSTRAINT "AuditTrailHash_audit_trail_id_fkey" FOREIGN KEY ("audit_trail_id") REFERENCES "AuditTrail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrailHash" ADD CONSTRAINT "AuditTrailHash_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrailBlockchainRef" ADD CONSTRAINT "AuditTrailBlockchainRef_audit_trail_id_fkey" FOREIGN KEY ("audit_trail_id") REFERENCES "AuditTrail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTrailBlockchainRef" ADD CONSTRAINT "AuditTrailBlockchainRef_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

