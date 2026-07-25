# Database Design


## Entity Relationship Diagram

```mermaid
erDiagram
    TENANTS {
        uuid id PK
        text status
        text plan
        timestamptz created_at
        timestamptz updated_at
    }

    USERS {
        uuid id PK
        uuid tenant_id FK
        text email UK
        text first_name
        text last_name
        text job_title
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    COMPANIES {
        uuid id PK
        uuid tenant_id FK
        text legal_name
        text display_name
        text tax_id
        text address
        text contact_email
        text contact_phone
        timestamptz created_at
        timestamptz updated_at
    }

    COMPANY_MEMBERSHIPS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid user_id FK
        text employment_status
        text department
        timestamptz created_at
        timestamptz updated_at
    }

    USER_SESSIONS {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        text refresh_token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz last_used_at
        timestamptz created_at
        timestamptz updated_at
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        text token_hash UK
        timestamptz expires_at
        timestamptz revoked_at
        timestamptz created_at
        timestamptz updated_at
    }

    ROLES {
        uuid id PK
        uuid tenant_id FK
        text code UK
        text name
        text description
        boolean is_system
        timestamptz created_at
        timestamptz updated_at
    }

    PERMISSIONS {
        uuid id PK
        text code UK
        text name
        text resource
        text action
        text description
        timestamptz created_at
    }

    ROLE_PERMISSIONS {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
        timestamptz created_at
    }

    USER_ROLES {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        uuid role_id FK
        uuid company_id FK
        timestamptz created_at
    }

    PURCHASE_REQUISITIONS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        text pr_number UK
        uuid requested_by_user_id FK
        text purpose
        text justification
        text status
        text priority
        text currency_code
        numeric total_amount
        date needed_by_date
        timestamptz submitted_at
        timestamptz approved_at
        timestamptz rejected_at
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }

    PURCHASE_REQUISITION_ITEMS {
        uuid id PK
        uuid tenant_id FK
        uuid purchase_requisition_id FK
        int line_no
        text item_type
        text description
        text specification
        numeric quantity
        text unit_of_measure
        numeric estimated_unit_cost
        numeric estimated_total_cost
        uuid category_id
        date needed_by_date
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    PURCHASE_REQUISITION_STATUS_LOGS {
        uuid id PK
        uuid tenant_id FK
        uuid purchase_requisition_id FK
        text from_status
        text to_status
        text action
        uuid acted_by_user_id FK
        text remarks
        timestamptz acted_at
        jsonb metadata_json
    }

    APPROVAL_REQUESTS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        text entity_type
        uuid entity_id
        uuid requester_user_id FK
        int current_level
        text status
        timestamptz submitted_at
        timestamptz resolved_at
        timestamptz created_at
        timestamptz updated_at
    }

    APPROVAL_WORKFLOW_LEVELS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        text workflow_code
        int level_no
        uuid role_id FK
        numeric min_amount
        numeric max_amount
        boolean is_required
        timestamptz created_at
        timestamptz updated_at
    }

    APPROVAL_ACTIONS {
        uuid id PK
        uuid tenant_id FK
        uuid approval_request_id FK
        uuid level_id FK
        uuid acted_by_user_id FK
        text action
        text remarks
        timestamptz acted_at
        timestamptz created_at
    }

    SUPPLIERS {
        uuid id PK
        uuid tenant_id FK
        text supplier_code UK
        text legal_name
        text display_name
        text tax_id
        text contact_email
        text contact_phone
        text address
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    SUPPLIER_INVITATIONS {
        uuid id PK
        uuid tenant_id FK
        uuid supplier_id FK
        uuid invited_by_user_id FK
        text email
        text token_hash UK
        text status
        timestamptz expires_at
        timestamptz accepted_at
        timestamptz created_at
        timestamptz updated_at
    }

    SUPPLIER_COMPANY_RELATIONSHIPS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid supplier_id FK
        text relationship_status
        timestamptz created_at
        timestamptz updated_at
    }

    RFQS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        text rfq_number UK
        uuid purchase_requisition_id FK
        uuid created_by_user_id FK
        text title
        text description
        text status
        date issue_date
        date closing_date
        timestamptz created_at
        timestamptz updated_at
    }

    RFQ_ITEMS {
        uuid id PK
        uuid tenant_id FK
        uuid rfq_id FK
        uuid purchase_requisition_item_id FK
        int line_no
        text description
        numeric quantity
        text unit_of_measure
        text specification
        timestamptz created_at
        timestamptz updated_at
    }

    RFQ_SUPPLIER_ASSIGNMENTS {
        uuid id PK
        uuid tenant_id FK
        uuid rfq_id FK
        uuid supplier_id FK
        timestamptz assigned_at
        text invitation_status
        timestamptz responded_at
        timestamptz created_at
        timestamptz updated_at
    }

    SUPPLIER_QUOTATIONS {
        uuid id PK
        uuid tenant_id FK
        uuid rfq_id FK
        uuid supplier_id FK
        text quotation_number UK
        text currency_code
        numeric total_amount
        text status
        timestamptz submitted_at
        date valid_until
        timestamptz created_at
        timestamptz updated_at
    }

    SUPPLIER_QUOTATION_ITEMS {
        uuid id PK
        uuid tenant_id FK
        uuid supplier_quotation_id FK
        uuid rfq_item_id FK
        int line_no
        numeric quoted_quantity
        numeric unit_price
        numeric total_price
        int lead_time_days
        text remarks
        timestamptz created_at
        timestamptz updated_at
    }

    PURCHASE_ORDERS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid supplier_id FK
        uuid purchase_requisition_id FK
        uuid rfq_id FK
        uuid supplier_quotation_id FK
        text po_number UK
        uuid issued_by_user_id FK
        text status
        text currency_code
        numeric total_amount
        date order_date
        date expected_delivery_date
        timestamptz approved_at
        timestamptz created_at
        timestamptz updated_at
    }

    PURCHASE_ORDER_ITEMS {
        uuid id PK
        uuid tenant_id FK
        uuid purchase_order_id FK
        text source_item_type
        uuid source_item_id
        int line_no
        text description
        numeric quantity
        text unit_of_measure
        numeric unit_price
        numeric total_price
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    PURCHASE_ORDER_APPROVALS {
        uuid id PK
        uuid tenant_id FK
        uuid purchase_order_id FK
        uuid approval_request_id FK
        uuid approved_by_user_id FK
        text action
        text remarks
        timestamptz acted_at
        timestamptz created_at
    }

    GOODS_RECEIPTS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid purchase_order_id FK
        uuid supplier_id FK
        text receipt_number UK
        uuid received_by_user_id FK
        text status
        date receipt_date
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    GOODS_RECEIPT_ITEMS {
        uuid id PK
        uuid tenant_id FK
        uuid goods_receipt_id FK
        uuid purchase_order_item_id FK
        int line_no
        numeric received_quantity
        numeric accepted_quantity
        numeric rejected_quantity
        text remarks
        timestamptz created_at
        timestamptz updated_at
    }

    DELIVERY_NOTIFICATIONS {
        uuid id PK
        uuid tenant_id FK
        uuid purchase_order_id FK
        uuid supplier_id FK
        uuid notified_by_user_id FK
        text message
        text status
        timestamptz notified_at
        timestamptz created_at
    }

    INVOICE_VERIFICATIONS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid supplier_id FK
        uuid purchase_order_id FK
        uuid goods_receipt_id FK
        text invoice_number
        date invoice_date
        text currency_code
        numeric total_amount
        text match_status
        text verification_status
        uuid verified_by_user_id FK
        timestamptz verified_at
        timestamptz created_at
        timestamptz updated_at
    }

    INVOICE_VERIFICATION_ITEMS {
        uuid id PK
        uuid tenant_id FK
        uuid invoice_verification_id FK
        uuid purchase_order_item_id FK
        uuid goods_receipt_item_id FK
        int line_no
        numeric invoiced_quantity
        numeric invoiced_unit_price
        numeric invoiced_total
        numeric variance_amount
        text variance_reason
        timestamptz created_at
        timestamptz updated_at
    }

    INVOICE_VERIFICATION_ATTACHMENTS {
        uuid id PK
        uuid tenant_id FK
        uuid invoice_verification_id FK
        text file_name
        text object_key
        text file_hash
        uuid uploaded_by_user_id FK
        timestamptz created_at
    }

    REPORT_REQUESTS {
        uuid id PK
        uuid tenant_id FK
        uuid requested_by_user_id FK
        text report_type
        jsonb parameters_json
        text status
        timestamptz created_at
        timestamptz completed_at
    }

    REPORT_EXPORTS {
        uuid id PK
        uuid tenant_id FK
        uuid report_request_id FK
        text format
        text object_key
        text file_hash
        uuid generated_by_user_id FK
        timestamptz created_at
        timestamptz expires_at
    }

    AUDIT_TRAILS {
        uuid id PK
        uuid tenant_id FK
        uuid actor_user_id FK
        text entity_type
        uuid entity_id
        text action
        text result
        text request_id
        jsonb details_json
        timestamptz created_at
    }

    AUDIT_TRAIL_HASHES {
        uuid id PK
        uuid tenant_id FK
        uuid audit_trail_id FK
        text hash_algorithm
        text hash_value UK
        timestamptz created_at
    }

    AUDIT_TRAIL_BLOCKCHAIN_REFS {
        uuid id PK
        uuid tenant_id FK
        uuid audit_trail_id FK
        text network_ref
        text transaction_id
        bigint block_number
        timestamptz anchored_at
    }

    TENANTS ||--o{ USERS : contains
    TENANTS ||--o{ COMPANIES : owns
    TENANTS ||--o{ COMPANY_MEMBERSHIPS : scopes
    TENANTS ||--o{ USER_SESSIONS : scopes
    TENANTS ||--o{ REFRESH_TOKENS : scopes
    TENANTS ||--o{ ROLES : defines
    TENANTS ||--o{ USER_ROLES : assigns
    TENANTS ||--o{ PURCHASE_REQUISITIONS : owns
    TENANTS ||--o{ PURCHASE_REQUISITION_ITEMS : scopes
    TENANTS ||--o{ PURCHASE_REQUISITION_STATUS_LOGS : scopes
    TENANTS ||--o{ APPROVAL_REQUESTS : scopes
    TENANTS ||--o{ APPROVAL_WORKFLOW_LEVELS : configures
    TENANTS ||--o{ APPROVAL_ACTIONS : scopes
    TENANTS ||--o{ SUPPLIERS : owns
    TENANTS ||--o{ SUPPLIER_INVITATIONS : scopes
    TENANTS ||--o{ SUPPLIER_COMPANY_RELATIONSHIPS : scopes
    TENANTS ||--o{ RFQS : owns
    TENANTS ||--o{ RFQ_ITEMS : scopes
    TENANTS ||--o{ RFQ_SUPPLIER_ASSIGNMENTS : scopes
    TENANTS ||--o{ SUPPLIER_QUOTATIONS : scopes
    TENANTS ||--o{ SUPPLIER_QUOTATION_ITEMS : scopes
    TENANTS ||--o{ PURCHASE_ORDERS : owns
    TENANTS ||--o{ PURCHASE_ORDER_ITEMS : scopes
    TENANTS ||--o{ PURCHASE_ORDER_APPROVALS : scopes
    TENANTS ||--o{ GOODS_RECEIPTS : owns
    TENANTS ||--o{ GOODS_RECEIPT_ITEMS : scopes
    TENANTS ||--o{ DELIVERY_NOTIFICATIONS : scopes
    TENANTS ||--o{ INVOICE_VERIFICATIONS : owns
    TENANTS ||--o{ INVOICE_VERIFICATION_ITEMS : scopes
    TENANTS ||--o{ INVOICE_VERIFICATION_ATTACHMENTS : scopes
    TENANTS ||--o{ REPORT_REQUESTS : scopes
    TENANTS ||--o{ REPORT_EXPORTS : scopes
    TENANTS ||--o{ AUDIT_TRAILS : scopes
    TENANTS ||--o{ AUDIT_TRAIL_HASHES : scopes
    TENANTS ||--o{ AUDIT_TRAIL_BLOCKCHAIN_REFS : scopes

    USERS ||--o{ COMPANY_MEMBERSHIPS : joins
    COMPANIES ||--o{ COMPANY_MEMBERSHIPS : has
    USERS ||--o{ USER_SESSIONS : opens
    USERS ||--o{ REFRESH_TOKENS : receives

    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : links
    USERS ||--o{ USER_ROLES : receives
    ROLES ||--o{ USER_ROLES : assigns
    COMPANIES ||--o{ USER_ROLES : scopes

    COMPANIES ||--o{ PURCHASE_REQUISITIONS : requests
    USERS ||--o{ PURCHASE_REQUISITIONS : creates
    PURCHASE_REQUISITIONS ||--o{ PURCHASE_REQUISITION_ITEMS : contains
    PURCHASE_REQUISITIONS ||--o{ PURCHASE_REQUISITION_STATUS_LOGS : logs
    USERS ||--o{ PURCHASE_REQUISITION_STATUS_LOGS : acts_on

    COMPANIES ||--o{ APPROVAL_REQUESTS : owns
    USERS ||--o{ APPROVAL_REQUESTS : submits
    APPROVAL_REQUESTS ||--o{ APPROVAL_ACTIONS : records
    APPROVAL_WORKFLOW_LEVELS ||--o{ APPROVAL_ACTIONS : controls
    ROLES ||--o{ APPROVAL_WORKFLOW_LEVELS : routes_to
    USERS ||--o{ APPROVAL_ACTIONS : performs

    USERS ||--o{ SUPPLIER_INVITATIONS : sends
    COMPANIES ||--o{ SUPPLIER_COMPANY_RELATIONSHIPS : engages
    SUPPLIERS ||--o{ SUPPLIER_COMPANY_RELATIONSHIPS : relates_to

    COMPANIES ||--o{ RFQS : issues
    USERS ||--o{ RFQS : creates
    PURCHASE_REQUISITIONS ||--o{ RFQS : converts_to
    RFQS ||--o{ RFQ_ITEMS : contains
    PURCHASE_REQUISITION_ITEMS ||--o{ RFQ_ITEMS : sources
    RFQS ||--o{ RFQ_SUPPLIER_ASSIGNMENTS : sends_to
    SUPPLIERS ||--o{ RFQ_SUPPLIER_ASSIGNMENTS : receives

    RFQS ||--o{ SUPPLIER_QUOTATIONS : receives
    SUPPLIERS ||--o{ SUPPLIER_QUOTATIONS : submits
    SUPPLIER_QUOTATIONS ||--o{ SUPPLIER_QUOTATION_ITEMS : contains
    RFQ_ITEMS ||--o{ SUPPLIER_QUOTATION_ITEMS : prices

    COMPANIES ||--o{ PURCHASE_ORDERS : issues
    SUPPLIERS ||--o{ PURCHASE_ORDERS : receives
    USERS ||--o{ PURCHASE_ORDERS : creates
    PURCHASE_REQUISITIONS ||--o{ PURCHASE_ORDERS : may_generate
    RFQS ||--o{ PURCHASE_ORDERS : may_generate
    SUPPLIER_QUOTATIONS ||--o{ PURCHASE_ORDERS : may_generate
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : contains
    APPROVAL_REQUESTS ||--o{ PURCHASE_ORDER_APPROVALS : backs
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_APPROVALS : logs
    USERS ||--o{ PURCHASE_ORDER_APPROVALS : acts_on

    COMPANIES ||--o{ GOODS_RECEIPTS : receives
    PURCHASE_ORDERS ||--o{ GOODS_RECEIPTS : results_in
    SUPPLIERS ||--o{ GOODS_RECEIPTS : delivers
    USERS ||--o{ GOODS_RECEIPTS : records
    GOODS_RECEIPTS ||--o{ GOODS_RECEIPT_ITEMS : contains
    PURCHASE_ORDER_ITEMS ||--o{ GOODS_RECEIPT_ITEMS : fulfills
    PURCHASE_ORDERS ||--o{ DELIVERY_NOTIFICATIONS : triggers
    SUPPLIERS ||--o{ DELIVERY_NOTIFICATIONS : notifies
    USERS ||--o{ DELIVERY_NOTIFICATIONS : sends

    COMPANIES ||--o{ INVOICE_VERIFICATIONS : verifies
    SUPPLIERS ||--o{ INVOICE_VERIFICATIONS : bills
    PURCHASE_ORDERS ||--o{ INVOICE_VERIFICATIONS : matched_against
    GOODS_RECEIPTS ||--o{ INVOICE_VERIFICATIONS : matched_against
    USERS ||--o{ INVOICE_VERIFICATIONS : verifies
    INVOICE_VERIFICATIONS ||--o{ INVOICE_VERIFICATION_ITEMS : contains
    PURCHASE_ORDER_ITEMS ||--o{ INVOICE_VERIFICATION_ITEMS : references
    GOODS_RECEIPT_ITEMS ||--o{ INVOICE_VERIFICATION_ITEMS : references
    INVOICE_VERIFICATIONS ||--o{ INVOICE_VERIFICATION_ATTACHMENTS : stores
    USERS ||--o{ INVOICE_VERIFICATION_ATTACHMENTS : uploads

    USERS ||--o{ REPORT_REQUESTS : requests
    REPORT_REQUESTS ||--o{ REPORT_EXPORTS : generates
    USERS ||--o{ REPORT_EXPORTS : generates

    USERS ||--o{ AUDIT_TRAILS : performs
    AUDIT_TRAILS ||--o{ AUDIT_TRAIL_HASHES : hashed_as
    AUDIT_TRAILS ||--o{ AUDIT_TRAIL_BLOCKCHAIN_REFS : anchored_as
```

---

## Tables

### tenants
- `id` | `uuid` | PK
- `status` | `text` | indexed
- `plan` | `text` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### users
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `email` | `text` | unique per tenant
- `first_name` | `text` | not null
- `last_name` | `text` | not null
- `job_title` | `text` | nullable
- `status` | `text` | indexed
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### companies
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `legal_name` | `text` | not null
- `display_name` | `text` | not null
- `tax_id` | `text` | nullable
- `address` | `text` | nullable
- `contact_email` | `text` | nullable
- `contact_phone` | `text` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### company_memberships
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `company_id` | `uuid` | FK -> companies.id, indexed
- `user_id` | `uuid` | FK -> users.id, indexed
- `employment_status` | `text` | indexed
- `department` | `text` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(tenant_id, company_id, user_id)` | `composite` | unique

### user_sessions
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `user_id` | `uuid` | FK -> users.id, indexed
- `refresh_token_hash` | `text` | unique
- `expires_at` | `timestamptz` | not null
- `revoked_at` | `timestamptz` | nullable
- `last_used_at` | `timestamptz` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### refresh_tokens
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `user_id` | `uuid` | FK -> users.id, indexed
- `token_hash` | `text` | unique
- `expires_at` | `timestamptz` | not null
- `revoked_at` | `timestamptz` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

## Access control

### roles
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `code` | `text` | unique per tenant
- `name` | `text` | not null
- `description` | `text` | nullable
- `is_system` | `boolean` | default false
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### permissions
- `id` | `uuid` | PK
- `code` | `text` | unique
- `name` | `text` | not null
- `resource` | `text` | indexed
- `action` | `text` | indexed
- `description` | `text` | nullable
- `created_at` | `timestamptz` | not null

### role_permissions
- `id` | `uuid` | PK
- `role_id` | `uuid` | FK -> roles.id, indexed
- `permission_id` | `uuid` | FK -> permissions.id, indexed
- `created_at` | `timestamptz` | not null
- `(role_id, permission_id)` | `composite` | unique

### user_roles
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `user_id` | `uuid` | FK -> users.id, indexed
- `role_id` | `uuid` | FK -> roles.id, indexed
- `company_id` | `uuid` | FK -> companies.id, nullable
- `created_at` | `timestamptz` | not null
- `(tenant_id, user_id, role_id, company_id)` | `composite` | unique

## Requisition and approval

### purchase_requisitions
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `company_id` | `uuid` | FK -> companies.id, indexed
- `pr_number` | `text` | unique per tenant
- `requested_by_user_id` | `uuid` | FK -> users.id
- `purpose` | `text` | nullable
- `justification` | `text` | nullable
- `status` | `text` | indexed
- `priority` | `text` | nullable
- `currency_code` | `text` | not null
- `total_amount` | `numeric(18,2)` | not null
- `needed_by_date` | `date` | nullable
- `submitted_at` | `timestamptz` | nullable
- `approved_at` | `timestamptz` | nullable
- `rejected_at` | `timestamptz` | nullable
- `deleted_at` | `timestamptz` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### purchase_requisition_items
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `purchase_requisition_id` | `uuid` | FK -> purchase_requisitions.id, indexed
- `line_no` | `integer` | not null
- `item_type` | `text` | indexed
- `description` | `text` | not null
- `specification` | `text` | nullable
- `quantity` | `numeric(18,4)` | not null
- `unit_of_measure` | `text` | not null
- `estimated_unit_cost` | `numeric(18,2)` | not null
- `estimated_total_cost` | `numeric(18,2)` | not null
- `category_id` | `uuid` | nullable
- `needed_by_date` | `date` | nullable
- `status` | `text` | indexed
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(purchase_requisition_id, line_no)` | `composite` | unique

### purchase_requisition_status_logs
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `purchase_requisition_id` | `uuid` | FK -> purchase_requisitions.id, indexed
- `from_status` | `text` | nullable
- `to_status` | `text` | not null
- `action` | `text` | indexed
- `acted_by_user_id` | `uuid` | FK -> users.id
- `remarks` | `text` | nullable
- `acted_at` | `timestamptz` | not null
- `metadata_json` | `jsonb` | nullable

### approval_requests
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `company_id` | `uuid` | FK -> companies.id, indexed
- `entity_type` | `text` | indexed
- `entity_id` | `uuid` | indexed
- `requester_user_id` | `uuid` | FK -> users.id
- `current_level` | `integer` | default 1
- `status` | `text` | indexed
- `submitted_at` | `timestamptz` | nullable
- `resolved_at` | `timestamptz` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### approval_workflow_levels
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `company_id` | `uuid` | FK -> companies.id, nullable
- `workflow_code` | `text` | indexed
- `level_no` | `integer` | not null
- `role_id` | `uuid` | FK -> roles.id
- `min_amount` | `numeric(18,2)` | nullable
- `max_amount` | `numeric(18,2)` | nullable
- `is_required` | `boolean` | default true
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(tenant_id, workflow_code, level_no)` | `composite` | unique

### approval_actions
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `approval_request_id` | `uuid` | FK -> approval_requests.id, indexed
- `level_id` | `uuid` | FK -> approval_workflow_levels.id
- `acted_by_user_id` | `uuid` | FK -> users.id
- `action` | `text` | indexed
- `remarks` | `text` | nullable
- `acted_at` | `timestamptz` | not null
- `created_at` | `timestamptz` | not null

## Supplier sourcing

### suppliers
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `supplier_code` | `text` | unique per tenant
- `legal_name` | `text` | not null
- `display_name` | `text` | not null
- `tax_id` | `text` | nullable
- `contact_email` | `text` | nullable
- `contact_phone` | `text` | nullable
- `address` | `text` | nullable
- `status` | `text` | indexed
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### supplier_invitations
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `supplier_id` | `uuid` | FK -> suppliers.id, nullable
- `invited_by_user_id` | `uuid` | FK -> users.id
- `email` | `text` | not null
- `token_hash` | `text` | unique
- `status` | `text` | indexed
- `expires_at` | `timestamptz` | not null
- `accepted_at` | `timestamptz` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### supplier_company_relationships
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `company_id` | `uuid` | FK -> companies.id, indexed
- `supplier_id` | `uuid` | FK -> suppliers.id, indexed
- `relationship_status` | `text` | indexed
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(tenant_id, company_id, supplier_id)` | `composite` | unique

### rfqs
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `company_id` | `uuid` | FK -> companies.id, indexed
- `rfq_number` | `text` | unique per tenant
- `purchase_requisition_id` | `uuid` | FK -> purchase_requisitions.id, nullable
- `created_by_user_id` | `uuid` | FK -> users.id
- `title` | `text` | not null
- `description` | `text` | nullable
- `status` | `text` | indexed
- `issue_date` | `date` | nullable
- `closing_date` | `date` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### rfq_items
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `rfq_id` | `uuid` | FK -> rfqs.id, indexed
- `purchase_requisition_item_id` | `uuid` | FK -> purchase_requisition_items.id, nullable
- `line_no` | `integer` | not null
- `description` | `text` | not null
- `quantity` | `numeric(18,4)` | not null
- `unit_of_measure` | `text` | not null
- `specification` | `text` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(rfq_id, line_no)` | `composite` | unique

### rfq_supplier_assignments
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `rfq_id` | `uuid` | FK -> rfqs.id, indexed
- `supplier_id` | `uuid` | FK -> suppliers.id, indexed
- `assigned_at` | `timestamptz` | not null
- `invitation_status` | `text` | indexed
- `responded_at` | `timestamptz` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(rfq_id, supplier_id)` | `composite` | unique

### supplier_quotations
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `rfq_id` | `uuid` | FK -> rfqs.id, indexed
- `supplier_id` | `uuid` | FK -> suppliers.id, indexed
- `quotation_number` | `text` | unique per tenant
- `currency_code` | `text` | not null
- `total_amount` | `numeric(18,2)` | not null
- `status` | `text` | indexed
- `submitted_at` | `timestamptz` | nullable
- `valid_until` | `date` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### supplier_quotation_items
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `supplier_quotation_id` | `uuid` | FK -> supplier_quotations.id, indexed
- `rfq_item_id` | `uuid` | FK -> rfq_items.id
- `line_no` | `integer` | not null
- `quoted_quantity` | `numeric(18,4)` | not null
- `unit_price` | `numeric(18,2)` | not null
- `total_price` | `numeric(18,2)` | not null
- `lead_time_days` | `integer` | nullable
- `remarks` | `text` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(supplier_quotation_id, line_no)` | `composite` | unique

## Ordering and receiving

### purchase_orders
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `company_id` | `uuid` | FK -> companies.id, indexed
- `supplier_id` | `uuid` | FK -> suppliers.id, indexed
- `purchase_requisition_id` | `uuid` | FK -> purchase_requisitions.id, nullable
- `rfq_id` | `uuid` | FK -> rfqs.id, nullable
- `supplier_quotation_id` | `uuid` | FK -> supplier_quotations.id, nullable
- `po_number` | `text` | unique per tenant
- `issued_by_user_id` | `uuid` | FK -> users.id
- `status` | `text` | indexed
- `currency_code` | `text` | not null
- `total_amount` | `numeric(18,2)` | not null
- `order_date` | `date` | not null
- `expected_delivery_date` | `date` | nullable
- `approved_at` | `timestamptz` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### purchase_order_items
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `purchase_order_id` | `uuid` | FK -> purchase_orders.id, indexed
- `source_item_type` | `text` | nullable
- `source_item_id` | `uuid` | nullable
- `line_no` | `integer` | not null
- `description` | `text` | not null
- `quantity` | `numeric(18,4)` | not null
- `unit_of_measure` | `text` | not null
- `unit_price` | `numeric(18,2)` | not null
- `total_price` | `numeric(18,2)` | not null
- `status` | `text` | indexed
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(purchase_order_id, line_no)` | `composite` | unique

### purchase_order_approvals
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `purchase_order_id` | `uuid` | FK -> purchase_orders.id, indexed
- `approval_request_id` | `uuid` | FK -> approval_requests.id
- `approved_by_user_id` | `uuid` | FK -> users.id
- `action` | `text` | indexed
- `remarks` | `text` | nullable
- `acted_at` | `timestamptz` | not null
- `created_at` | `timestamptz` | not null

### goods_receipts
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `company_id` | `uuid` | FK -> companies.id, indexed
- `purchase_order_id` | `uuid` | FK -> purchase_orders.id, indexed
- `supplier_id` | `uuid` | FK -> suppliers.id, indexed
- `receipt_number` | `text` | unique per tenant
- `received_by_user_id` | `uuid` | FK -> users.id
- `status` | `text` | indexed
- `receipt_date` | `date` | not null
- `notes` | `text` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### goods_receipt_items
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `goods_receipt_id` | `uuid` | FK -> goods_receipts.id, indexed
- `purchase_order_item_id` | `uuid` | FK -> purchase_order_items.id, indexed
- `line_no` | `integer` | not null
- `received_quantity` | `numeric(18,4)` | not null
- `accepted_quantity` | `numeric(18,4)` | not null
- `rejected_quantity` | `numeric(18,4)` | default 0
- `remarks` | `text` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(goods_receipt_id, line_no)` | `composite` | unique

### delivery_notifications
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `purchase_order_id` | `uuid` | FK -> purchase_orders.id, indexed
- `supplier_id` | `uuid` | FK -> suppliers.id, indexed
- `notified_by_user_id` | `uuid` | FK -> users.id
- `message` | `text` | nullable
- `status` | `text` | indexed
- `notified_at` | `timestamptz` | not null
- `created_at` | `timestamptz` | not null

## Invoice verification

### invoice_verifications
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `company_id` | `uuid` | FK -> companies.id, indexed
- `supplier_id` | `uuid` | FK -> suppliers.id, indexed
- `purchase_order_id` | `uuid` | FK -> purchase_orders.id, indexed
- `goods_receipt_id` | `uuid` | FK -> goods_receipts.id, nullable
- `invoice_number` | `text` | indexed
- `invoice_date` | `date` | not null
- `currency_code` | `text` | not null
- `total_amount` | `numeric(18,2)` | not null
- `match_status` | `text` | indexed
- `verification_status` | `text` | indexed
- `verified_by_user_id` | `uuid` | FK -> users.id, nullable
- `verified_at` | `timestamptz` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null

### invoice_verification_items
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `invoice_verification_id` | `uuid` | FK -> invoice_verifications.id, indexed
- `purchase_order_item_id` | `uuid` | FK -> purchase_order_items.id
- `goods_receipt_item_id` | `uuid` | FK -> goods_receipt_items.id, nullable
- `line_no` | `integer` | not null
- `invoiced_quantity` | `numeric(18,4)` | not null
- `invoiced_unit_price` | `numeric(18,2)` | not null
- `invoiced_total` | `numeric(18,2)` | not null
- `variance_amount` | `numeric(18,2)` | nullable
- `variance_reason` | `text` | nullable
- `created_at` | `timestamptz` | not null
- `updated_at` | `timestamptz` | not null
- `(invoice_verification_id, line_no)` | `composite` | unique

### invoice_verification_attachments
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `invoice_verification_id` | `uuid` | FK -> invoice_verifications.id, indexed
- `file_name` | `text` | not null
- `object_key` | `text` | not null
- `file_hash` | `text` | nullable
- `uploaded_by_user_id` | `uuid` | FK -> users.id
- `created_at` | `timestamptz` | not null

## Reporting and audit

### report_requests
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `requested_by_user_id` | `uuid` | FK -> users.id
- `report_type` | `text` | indexed
- `parameters_json` | `jsonb` | nullable
- `status` | `text` | indexed
- `created_at` | `timestamptz` | not null
- `completed_at` | `timestamptz` | nullable

### report_exports
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `report_request_id` | `uuid` | FK -> report_requests.id, indexed
- `format` | `text` | indexed
- `object_key` | `text` | not null
- `file_hash` | `text` | nullable
- `generated_by_user_id` | `uuid` | FK -> users.id
- `created_at` | `timestamptz` | not null
- `expires_at` | `timestamptz` | nullable

### audit_trails
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `actor_user_id` | `uuid` | FK -> users.id, nullable
- `entity_type` | `text` | indexed
- `entity_id` | `uuid` | indexed
- `action` | `text` | indexed
- `result` | `text` | indexed
- `request_id` | `text` | nullable
- `details_json` | `jsonb` | nullable
- `created_at` | `timestamptz` | not null

### audit_trail_hashes
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `audit_trail_id` | `uuid` | FK -> audit_trails.id, indexed
- `hash_algorithm` | `text` | not null
- `hash_value` | `text` | unique
- `created_at` | `timestamptz` | not null

### audit_trail_blockchain_refs
- `id` | `uuid` | PK
- `tenant_id` | `uuid` | FK -> tenants.id, indexed
- `audit_trail_id` | `uuid` | FK -> audit_trails.id, indexed
- `network_ref` | `text` | nullable
- `transaction_id` | `text` | indexed
- `block_number` | `bigint` | nullable
- `anchored_at` | `timestamptz` | nullable

---

## Relationships
```mermaid
erDiagram
    TENANTS ||--o{ USERS : contains
    TENANTS ||--o{ COMPANIES : owns
    TENANTS ||--o{ COMPANY_MEMBERSHIPS : scopes
    TENANTS ||--o{ USER_SESSIONS : scopes
    TENANTS ||--o{ REFRESH_TOKENS : scopes
    TENANTS ||--o{ ROLES : defines
    TENANTS ||--o{ USER_ROLES : assigns

    USERS ||--o{ COMPANY_MEMBERSHIPS : joins
    COMPANIES ||--o{ COMPANY_MEMBERSHIPS : has
    USERS ||--o{ USER_SESSIONS : opens
    USERS ||--o{ REFRESH_TOKENS : receives
    USERS ||--o{ USER_ROLES : assigned
    ROLES ||--o{ USER_ROLES : assigned_to

    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : links
    COMPANIES ||--o{ USER_ROLES : scopes

    TENANTS ||--o{ PURCHASE_REQUISITIONS : owns
    COMPANIES ||--o{ PURCHASE_REQUISITIONS : requests
    USERS ||--o{ PURCHASE_REQUISITIONS : requested_by
    PURCHASE_REQUISITIONS ||--o{ PURCHASE_REQUISITION_ITEMS : contains
    PURCHASE_REQUISITIONS ||--o{ PURCHASE_REQUISITION_STATUS_LOGS : logs
    USERS ||--o{ PURCHASE_REQUISITION_STATUS_LOGS : acted_by

    TENANTS ||--o{ APPROVAL_REQUESTS : scopes
    COMPANIES ||--o{ APPROVAL_REQUESTS : owns
    USERS ||--o{ APPROVAL_REQUESTS : submits
    APPROVAL_REQUESTS ||--o{ APPROVAL_ACTIONS : records
    APPROVAL_WORKFLOW_LEVELS ||--o{ APPROVAL_ACTIONS : controls
    USERS ||--o{ APPROVAL_ACTIONS : acts
    ROLES ||--o{ APPROVAL_WORKFLOW_LEVELS : routes_to

    TENANTS ||--o{ SUPPLIERS : owns
    TENANTS ||--o{ SUPPLIER_INVITATIONS : scopes
    TENANTS ||--o{ SUPPLIER_COMPANY_RELATIONSHIPS : scopes
    COMPANIES ||--o{ SUPPLIER_COMPANY_RELATIONSHIPS : connects
    SUPPLIERS ||--o{ SUPPLIER_COMPANY_RELATIONSHIPS : connects
    USERS ||--o{ SUPPLIER_INVITATIONS : invited_by

    COMPANIES ||--o{ RFQS : issues
    USERS ||--o{ RFQS : creates
    PURCHASE_REQUISITIONS ||--o{ RFQS : converts_to
    RFQS ||--o{ RFQ_ITEMS : contains
    PURCHASE_REQUISITION_ITEMS ||--o{ RFQ_ITEMS : sources
    RFQS ||--o{ RFQ_SUPPLIER_ASSIGNME
```
