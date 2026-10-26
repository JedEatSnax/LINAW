# Supplier Management API Contract

## 1. Overview

Supplier Management covers supplier governance for purchasing companies, supplier invitations/onboarding, and supplier-facing RFQ/quotation portal operations. The live module is mounted at `/api/suppliers`.

The router has three service groups: governance, invitations, and portal. One invitation-token validation route is public; all other routes require authentication and route permission authorization. Supplier identity for portal operations is derived from the authenticated user's tenant/company context, not accepted from the client.

## 2. Implementation References

### Router and mounting

- `backend/src/app.ts`: creates the `/api` base path and mounts the router at `/suppliers`.
- `backend/src/modules/supplier_management/supplierManagementRouter.ts`: registers 14 live routes and their permissions.

### Governance

- `SupplierManagementGovernance/supplierManagementGovernanceController.ts`
- `SupplierManagementGovernance/supplierManagementGovernanceService.ts`
- `SupplierManagementGovernance/supplierManagementGovernanceRepository.ts`
- `SupplierManagementGovernance/supplierManagementGovernanceValidator.ts`

### Invitations

- `SupplierManagementInvitation/supplierManagementInvitationController.ts`
- `SupplierManagementInvitation/supplierManagementInvitationService.ts`
- `SupplierManagementInvitation/supplierManagementInvitationRepository.ts`
- `SupplierManagementInvitation/supplierManagementInvitationValidator.ts`

### Portal

- `supplierManagementPortal/supplierManagementPortalController.ts`
- `supplierManagementPortal/supplierManagementPortalService.ts`
- `supplierManagementPortal/supplierManagementPortalRepository.ts`
- `supplierManagementPortal/supplierManagementPortalValidator.ts`
- `supplierManagementPortal/supplierManagementPortalEventHandler.ts`

### Shared and persistence references

- `backend/src/shared/middleware/authenticate.ts`: validates Bearer JWT/session context.
- `backend/src/shared/Authorization/authorize.ts`: checks permissions; `ORGANIZATION_ADMIN` bypasses individual permission membership.
- `backend/src/shared/Authorization/seeds/systemPermissions.ts`: defines supplier permissions.
- `backend/src/shared/middleware/errorHandler.ts` and `backend/src/shared/errors/appError.ts`: shared error serialization/status mapping.
- `backend/prisma/schema.prisma`: `Supplier`, `SupplierInvitation`, `SupplierCompanyRelationship`, `RFQ`, `RFQItem`, `SupplierQuotation`, and `SupplierQuotationItem`.

## 3. Authentication and Authorization

Authenticated routes require:

```http
Authorization: Bearer <access-token>
```

The token must contain non-empty `user_id`, `session_id`, and `tenant_id`; `company_id` is optional to the authentication middleware, but controllers require company context and return `404 User does not belong to a company` when absent. The session must match user/tenant, be active, unrevoked, and unexpired.

The public route `GET /api/suppliers/supplier-invitations/validate/:token` is registered before `authenticate` and requires no route permission. Other permissions are:

| Route group                   | Permissions                           |
| ----------------------------- | ------------------------------------- |
| Governance list               | `supplier_management:read`            |
| Governance detail             | `supplier_management:read_supplier`   |
| Deactivate relationship       | `supplier_management:remove_supplier` |
| Create/resend invitation      | `supplier_management:invite_supplier` |
| Accept/list/detail invitation | `supplier_management:read`            |
| Portal RFQs                   | `supplier:read_rfq`                   |
| Portal quotations             | `supplier:read`                       |
| Submit quotation              | `supplier:submit_quotation`           |

Permission failures return unwrapped `403 { "message": "Forbidden" }`. Handled service/validation errors use `{ success: false, error: { code, message } }`; development mode may include error details.

## 4. Endpoint Inventory

| Method | Effective Path                                                 | Purpose                          | Authentication         | Authorization                         |
| ------ | -------------------------------------------------------------- | -------------------------------- | ---------------------- | ------------------------------------- |
| GET    | `/api/suppliers/supplier-invitations/validate/:token`          | Validate invitation token        | None                   | None                                  |
| GET    | `/api/suppliers/suppliers-governance`                          | List associated suppliers        | Bearer/company context | `supplier_management:read`            |
| GET    | `/api/suppliers/suppliers-governce/:supplierId`                | Retrieve one supplier            | Bearer/company context | `supplier_management:read_supplier`   |
| DELETE | `/api/suppliers/suppliers-governance/:supplierId/relationship` | Deactivate supplier relationship | Bearer/company context | `supplier_management:remove_supplier` |
| POST   | `/api/suppliers/supplier-invitations`                          | Create and send invitation       | Bearer/company context | `supplier_management:invite_supplier` |
| POST   | `/api/suppliers/supplier-invitations/:invitationId/resend`     | Resend eligible invitation       | Bearer/company context | `supplier_management:invite_supplier` |
| POST   | `/api/suppliers/supplier-invitations/:invitationId/accept`     | Accept invitation                | Bearer token           | `supplier_management:read`            |
| GET    | `/api/suppliers/supplier-invitations`                          | List invitations                 | Bearer/company context | `supplier_management:read`            |
| GET    | `/api/suppliers/supplier-invitations/:invitationId`            | Retrieve invitation              | Bearer/company context | `supplier_management:read`            |
| GET    | `/api/suppliers/supplier-portal/rfqs`                          | List available RFQs              | Bearer/company context | `supplier:read_rfq`                   |
| GET    | `/api/suppliers/supplier-portal/rfqs/:rfqId`                   | Retrieve available RFQ           | Bearer/company context | `supplier:read_rfq`                   |
| GET    | `/api/suppliers/supplier-portal/quotations`                    | List supplier quotations         | Bearer/company context | `supplier:read`                       |
| GET    | `/api/suppliers/supplier-portal/quotations/:quotationId`       | Retrieve supplier quotation      | Bearer/company context | `supplier:read`                       |
| POST   | `/api/suppliers/supplier-portal/rfqs/:rfqId/quotations`        | Submit quotation                 | Bearer/company context | `supplier:submit_quotation`           |

The detail governance route contains the implemented spelling `suppliers-governce` (missing “an”); clients must use that path.

## 5. Detailed Endpoint Contracts

### GET `/api/suppliers/suppliers-governance`

**Purpose:** Lists active suppliers associated with the authenticated purchasing company.

**Implementation:** Governance controller -> service -> `getSuppliers` repository query.

**Query Parameters:** `name` optional trimmed 1-200 string, case-insensitive legal/display-name search; `status` optional trimmed 1-32 string, defaults in repository to `ACTIVE` when omitted; `relationship_status` optional trimmed 1-32 string, repository default `ACTIVE`; `page` integer default `1`, minimum `1`; `limit` integer default `20`, range `1-100`.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Suppliers retrieved successfully.",
  "data": {
    "suppliers": [
      {
        "supplier_id": "supplier-uuid",
        "supplier_code": "SUP-001",
        "company_id": "supplier-company-uuid",
        "legal_name": "Supplier Ltd",
        "display_name": "Supplier",
        "tax_id": null,
        "contact_email": "supplier@example.com",
        "contact_phone": null,
        "address": null,
        "supplier_status": "ACTIVE",
        "relationship_status": "ACTIVE",
        "relationship": {
          "relationship_id": "relationship-uuid",
          "relationship_status": "ACTIVE"
        },
        "created_at": "2026-10-21T12:00:00.000Z",
        "updated_at": "2026-10-21T12:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1 }
  }
}
```

Only suppliers with a matching tenant/company relationship and requested relationship status are returned. Results are ordered by supplier creation descending.

**Errors:** `404` without company context; `422` for invalid query; `401`, `403`, or generic `500` as shared.

### GET `/api/suppliers/suppliers-governce/:supplierId`

**Purpose:** Retrieves an active supplier associated with the authenticated company.

**Path Parameters:** `supplierId` must be a UUID.

**Success Response:** `200` with `{ "success": true, "message": "Supplier retrieved successfully.", "data": <supplier response> }`, using the same flattened fields as the list endpoint.

**Errors:** `404` for missing company context or when the supplier is absent, inactive, or lacks an active relationship; `422` for invalid UUID; `401`, `403`, or `500` as shared.

### DELETE `/api/suppliers/suppliers-governance/:supplierId/relationship`

**Purpose:** Deactivates the authenticated purchasing company's relationship with a supplier without deleting the supplier identity.

**Path Parameters:** `supplierId` must be a UUID.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Supplier relationship deactivated successfully.",
  "data": {
    "supplier_id": "supplier-uuid",
    "relationship_id": "relationship-uuid",
    "relationship_status": "INACTIVE"
  }
}
```

**Errors:** `404` when no active relationship exists or company context is absent; `422` for invalid UUID; `401`, `403`, or `500` as shared.

**Side Effects:** Transactionally changes only the relationship to `INACTIVE`; supplier identity and procurement history remain.

### POST `/api/suppliers/supplier-invitations`

**Purpose:** Creates a draft supplier invitation, sends its email, and changes it to pending.

**Request Body:**

```json
{ "email": "supplier-contact@example.com" }
```

Email is trimmed, lowercased, valid, and at most 254 characters.

**Success Response:** `201`:

```json
{
  "success": true,
  "message": "Supplier invitation created successfully.",
  "data": {
    "invitation_id": "invitation-uuid",
    "invitation_status": "PENDING",
    "email": "supplier-contact@example.com",
    "expires_at": "2026-10-24T12:00:00.000Z"
  }
}
```

**Errors:** `404` without company context or invitation lookup failure; `422` invalid email; `503` email delivery/status update failure; `401`, `403`, or `500` as shared.

**Business Rules and Side Effects:** A random token is generated, SHA-256 hashed, stored, and placed only in the emailed URL. Expiration is 72 hours. Invitation transitions `DRAFT -> SENDING -> PENDING`; email failure resets it to `DRAFT`, clears token/expiry, and returns `503`.

### GET `/api/suppliers/supplier-invitations`

**Purpose:** Lists invitations created by the authenticated purchasing company.

**Query Parameters:** `status` optional trimmed 1-32 string; `email` optional normalized email; `page` default `1`, minimum `1`; `limit` default `20`, range `1-100`.

**Success Response:** `200` with `{ "success": true, "message": "Supplier invitations retrieved successfully.", "data": { "invitations": [<invitation summary>], "pagination": { "page", "limit", "total", "total_pages" } } }`.

Invitation summaries contain `invitation_id`, `email`, `invitation_status`, nullable `expires_at`, nullable `accepted_at`, `created_at`, and `updated_at`.

**Errors:** `404` without company context; `422` invalid query; `401`, `403`, or `500` as shared.

### GET `/api/suppliers/supplier-invitations/:invitationId`

**Purpose:** Retrieves one company-scoped invitation.

**Path Parameters:** `invitationId` must be a UUID.

**Success Response:** `200` with the invitation summary under `data`.

**Errors:** `404` when invitation is absent/outside tenant/company or context is absent; `422` invalid UUID; `401`, `403`, or `500` as shared.

### POST `/api/suppliers/supplier-invitations/:invitationId/resend`

**Purpose:** Resends an invitation that is `DRAFT` or an expired `PENDING` invitation.

**Path Parameters:** `invitationId` must be a UUID. No body is read.

**Success Response:** `200` with `{ "success": true, "message": "Supplier invitation resend requested.", "data": { "invitation_id", "invitation_status": "PENDING", "email", "expires_at" } }`.

**Errors:** `404` missing invitation/context; `409` if not draft or expired pending, or conditional preparation fails; `503` email/status failure; `422` invalid UUID; `401`, `403`, or `500` as shared.

**Side Effects:** Replaces token hash and expiry, sends email, and transitions through `SENDING` to `PENDING`; email failure resets to draft.

### GET `/api/suppliers/supplier-invitations/validate/:token`

**Purpose:** Publicly validates an invitation token and identifies the onboarding action.

**Authentication:** None. This route is registered before the router-wide authentication middleware.

**Path Parameters:** `token` must be 32-512 characters matching `[A-Za-z0-9_-]+`.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Supplier invitation is valid.",
  "data": {
    "invitation_id": "invitation-uuid",
    "invitation_status": "PENDING",
    "expires_at": "2026-10-24T12:00:00.000Z",
    "onboarding_action": "EXISTING_COMPANY"
  }
}
```

`onboarding_action` is `EXISTING_COMPANY` when an active tenant user with the invitation email exists; otherwise `REGISTER_COMPANY`.

**Errors:** `404` invalid/unknown token; `409` non-pending invitation; `410 GONE` expired invitation; `422` invalid token format; `500` unhandled errors.

**Security Rule:** Raw tokens are never stored. The response does not expose the token or invitation email.

### POST `/api/suppliers/supplier-invitations/:invitationId/accept`

**Purpose:** Authenticated invitee accepts an invitation and creates/reactivates the supplier relationship.

**Path Parameters:** `invitationId` UUID.

**Request Body:**

```json
{ "token": "invitation-token", "company_id": "supplier-company-uuid" }
```

`token` uses the same token format rules. `company_id` is optional; when omitted, exactly one active membership determines the accepting company. The route uses `supplier_management:read` in the live router.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Supplier invitation accepted successfully.",
  "data": {
    "invitation_id": "invitation-uuid",
    "relationship_id": "relationship-uuid",
    "status": "ACCEPTED",
    "accepted_at": "2026-10-21T12:00:00.000Z"
  }
}
```

**Errors:** `404` missing invitation or user; `409` invalid lifecycle, email mismatch, no/ambiguous membership, wrong company membership, or concurrent acceptance; `410` expired; `422` invalid body/IDs; `401`, `403`, or `500` as shared.

**Business Rules and Side Effects:** The authenticated account email must match the invitation email. The selected company must be an active membership in the authenticated tenant. Acceptance is transactional: revalidates token/expiry, reuses or creates an active supplier identity for the accepting company, upserts the purchasing-company relationship to `ACTIVE`, and conditionally changes invitation to `ACCEPTED`.

### GET `/api/suppliers/supplier-portal/rfqs`

**Purpose:** Lists published RFQs available to the authenticated supplier company.

**Success Response:** `200` with `{ "success": true, "message": "Available RFQs retrieved successfully.", "data": [<published RFQ including items>] }`.

**Errors:** `404` if authenticated company is not an active supplier; `403` missing `supplier:read_rfq`; `401` or `500` as shared.

**Business Rules:** RFQs must be `PUBLISHED` and their purchasing company must have an `ACTIVE` relationship with the resolved supplier.

### GET `/api/suppliers/supplier-portal/rfqs/:rfqId`

**Purpose:** Retrieves one published RFQ available to the supplier.

**Path Parameters:** `rfqId` must be a UUID.

**Success Response:** `200` with the RFQ including its items under `data`.

**Errors:** `404` for inactive supplier or unavailable/out-of-scope RFQ; `422` invalid UUID; `401`, `403`, or `500` as shared.

### GET `/api/suppliers/supplier-portal/quotations`

**Purpose:** Lists quotations belonging to the resolved supplier identity.

**Success Response:** `200` with `{ "success": true, "message": "Supplier quotations retrieved successfully.", "data": [<SupplierQuotation including items>] }`.

**Errors:** `404` if company is not an active supplier; `403` missing `supplier:read`; `401` or `500` as shared. No pagination is implemented.

### GET `/api/suppliers/supplier-portal/quotations/:quotationId`

**Purpose:** Retrieves one quotation belonging to the resolved supplier.

**Path Parameters:** `quotationId` must be a UUID.

**Success Response:** `200` with the quotation including items under `data`.

**Errors:** `404` if inactive supplier, missing quotation, or another supplier's quotation; `422` invalid UUID; `401`, `403`, or `500` as shared.

### POST `/api/suppliers/supplier-portal/rfqs/:rfqId/quotations`

**Purpose:** Submits one quotation for every item in an eligible RFQ.

**Path Parameters:** `rfqId` must be a UUID.

**Request Body:**

```json
{
  "currency_code": "USD",
  "valid_until": "2026-11-15",
  "items": [
    {
      "rfq_item_id": "rfq-item-uuid",
      "quoted_quantity": 10,
      "unit_price": 125.5,
      "lead_time_days": 14,
      "remarks": "Delivery included"
    }
  ]
}
```

`currency_code` defaults to the shared default and has currency precision checks. `valid_until` is optional and must not be in the past. Items are required and non-empty; each RFQ item ID must be UUID, quantity and unit price positive with up to four decimals, lead time an optional nonnegative integer, and remarks optional up to 1000 characters. Every RFQ item must appear exactly once.

**Success Response:** `201` with `{ "success": true, "message": "Supplier quotation submitted successfully.", "data": <created SupplierQuotation including items> }`. Service calculates line totals and total amount; clients' totals are not accepted.

**Errors:** `404` inactive supplier or unavailable RFQ; plain business validation errors may become generic `500` because the service throws plain `Error`; `422` schema failure; `401`, `403`, or `500` as shared.

**Business Rules and Side Effects:** RFQ must be published, relationship active, and before its closing date. Quotation is created as `SUBMITTED`, duplicate non-cancelled quotations for the same supplier/RFQ are rejected, and all items must belong to the RFQ exactly once. Successful creation publishes the supplier-quotation-submitted event after the transaction.

## 6. Shared Data Structures and Enums

- Supplier statuses and relationship/invitation/quotation statuses are stored as strings; validators constrain only some inputs. Implemented values include supplier `ACTIVE`, relationship `ACTIVE/INACTIVE`, invitation `DRAFT/SENDING/PENDING/ACCEPTED`, RFQ `PUBLISHED`, and quotation `SUBMITTED`.
- Governance responses flatten supplier and represented company fields and include the first relationship summary.
- Invitation summaries expose ID, email, status, expiry, accepted time, and timestamps, but never raw token values.
- Portal RFQ/quotation responses are direct Prisma projections with included items; exact Decimal/Date serialization follows runtime behavior.

## 7. Cross-Endpoint Business Rules

- Governance uses the authenticated purchasing tenant/company and active supplier-company relationships.
- Portal supplier identity is resolved from the authenticated company's active `Supplier` record; clients cannot choose a supplier ID.
- Invitation acceptance reuses an existing supplier identity for the accepting company and upserts the purchasing relationship, preventing duplicate relationships.
- Relationship deactivation preserves supplier identity/history and blocks new portal RFQ visibility through that relationship.
- Invitation tokens are hashed with SHA-256, expire after 72 hours, and are conditionally consumed to prevent replay/concurrent duplicate acceptance.
- Supplier quotation submission is transactional and requires complete, unique RFQ-item coverage.

## 8. Frontend Integration Notes

- Use `/api/suppliers`, not the older `/api/suppliers/:supplierId` governance paths from design drafts. The live governance detail spelling is `/suppliers-governce/:supplierId`.
- Validate invitation tokens publicly before authenticated acceptance, but acceptance revalidates token, expiry, email, membership, and lifecycle server-side.
- Preserve exact route-specific response wrappers and messages; governance, invitations, and portal responses are not identical.
- Use pagination only for governance suppliers and invitations. Portal lists have no pagination parameters.
- Handle `403 { message: "Forbidden" }`, shared `401/404/409/410/422/503` errors, and generic `500` responses separately.
- Portal quotations submit calculated totals and trigger an event consumed by Purchase Order Management; supplier users cannot select quotations or create POs.

## 9. Contract Gaps and Implementation Discrepancies

1. **The requested documentation location is stale.** The target is `supplier_management`, while the prompt names the Approval Workflow directory. This contract is stored in the actual target module directory.
2. **The governance detail path is misspelled.** The live route is `suppliers-governce/:supplierId`, while design documentation uses `/suppliers/:supplierId`.
3. **The legacy API design is broader/different from the live implementation.** Live routes and response shapes are the source of truth; several design-only route names, fields, and statuses are not registered.
4. **Invitation acceptance uses `supplier_management:read`, not a dedicated accept permission.** This is the live authorization contract.
5. **Portal list/detail repositories filter by supplier ID but do not independently add tenant/company predicates.** Supplier resolution scopes the identity, but cross-tenant data isolation relies on consistent supplier relationships and IDs.
6. **Plain business-rule errors become generic `500`.** Portal submission throws plain `Error` for past validity dates, incomplete/duplicate items, foreign RFQ items, and duplicate submission; these are not mapped to structured `400/409` responses.
7. **Supplier governance status filters are arbitrary strings.** No enum validation prevents unsupported supplier or relationship status values.
8. **Invitation creation and email delivery are not one transaction.** The invitation is created before sending; later email failure can leave a draft invitation, while resend uses an explicit reset path.
9. **The live event handler publishes quotation submission after persistence, but subscriber failure can still surface after the quotation exists.** No compensation behavior is implemented in this module.

## 10. Verification Summary

- **Verified endpoints:** 14 live router registrations.
- **Routes accounted for:** public invitation validation, governance, invitation, and portal routes in `supplierManagementRouter.ts`, combined with `/api` and `/suppliers` mounts in `app.ts`.
- **Layers inspected:** application bootstrap, router, governance/invitation/portal controllers, services, repositories, validators, event handler, authentication, authorization, permission seeds, shared errors, Prisma supplier/RFQ/quotation models, and legacy API/design documentation.
- **Runtime testing:** not performed. This contract is based on static source inspection; no data-changing requests were issued.
- **Unresolved questions:** exact Decimal/Date JSON serialization, deployed route behavior for the misspelled governance path, and runtime database behavior for unhandled constraints require runtime verification.
- **Files changed:** only `backend/src/modules/supplier_management/api_contract.md` for this task. No application source, frontend, Prisma schema, or migration files were modified.
