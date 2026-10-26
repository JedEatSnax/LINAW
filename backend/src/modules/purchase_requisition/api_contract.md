# Purchase Requisition API Contract

## 1. Overview

The Purchase Requisition module creates, edits, submits, cancels, lists, details, and resubmits purchase requisitions. Revisions are stored as separate records linked by `root_id`; cancellation is a status transition, not deletion.

The live API base path is `/api/PurchaseRequisition`. The application uses Hono and mounts this router from `backend/src/app.ts`. All routes require Bearer authentication, rate limiting, and route-specific permissions. Submission and cancellation publish internal events consumed by other modules.

## 2. Implementation References

### Router and application mounting

- `backend/src/app.ts`: creates the `/api` base path and mounts this router at `/PurchaseRequisition`.
- `backend/src/modules/purchase_requisition/purchaseRequisitionRouter.ts`: registers seven reachable routes.

### Controller, service, repository, and validation

- `backend/src/modules/purchase_requisition/purchaseRequisitionController.ts`: parses request input, requires company context, summarizes responses, and calls the service.
- `backend/src/modules/purchase_requisition/purchaseRequisitionService.ts`: enforces authorship, membership, status transitions, revision creation, totals, and event publication.
- `backend/src/modules/purchase_requisition/purchaseRequisitionRepository.ts`: performs Prisma queries and transactional creation/update/status-log persistence.
- `backend/src/modules/purchase_requisition/purchaseRequisitionValidation.ts`: defines body, query, path, status, item, currency, and date validation.

### Authentication and authorization

- `backend/src/shared/middleware/authenticate.ts`: validates the Bearer JWT and session and sets `c.var.user`.
- `backend/src/shared/Authorization/authorize.ts`: resolves role permissions; `ORGANIZATION_ADMIN` bypasses individual permission membership.
- `backend/src/shared/Authorization/seeds/systemPermissions.ts`: defines `pr:create`, `pr:cancel`, `pr:submit`, `pr:update`, and `pr:read`.

### Relevant data and shared errors

- `backend/prisma/schema.prisma`: `PurchaseRequisition`, `PurchaseRequisitionItem`, `PurchaseRequisitionStatusLog`, `CompanyMembership`, `Tenant`, `Company`, and related approval/RFQ/PO relations.
- `backend/src/shared/middleware/errorHandler.ts`: converts Zod errors to `422 INVALID DATA`, serializes `AppError`, and returns generic `500` for plain/unhandled errors.
- `backend/src/shared/errors/appError.ts`: defines authentication, authorization, not-found, conflict, validation, and server errors.

## 3. Authentication and Authorization

Every route requires:

```http
Authorization: Bearer <access-token>
```

The HS256 token must contain non-empty `user_id`, `session_id`, and `tenant_id`; `company_id` is optional to the authentication middleware, but this module requires it and throws `401` with `Company context is required` when absent. The session must match the token user/tenant, be unrevoked and unexpired, and belong to an active user.

Route permissions:

| Operation        | Permission  |
| ---------------- | ----------- |
| Create           | `pr:create` |
| Submit/resubmit  | `pr:submit` |
| Cancel           | `pr:cancel` |
| Read/list/detail | `pr:read`   |
| Update           | `pr:update` |

Permission failures return an unwrapped `403` response `{ "message": "Forbidden" }`. Service operations additionally require an active membership for the authenticated tenant/company. Mutation operations verify the requester owns the requisition.

## 4. Endpoint Inventory

| Method | Effective Path                                     | Purpose                                                 | Authentication                   | Authorization               |
| ------ | -------------------------------------------------- | ------------------------------------------------------- | -------------------------------- | --------------------------- |
| POST   | `/api/PurchaseRequisition/create`                  | Create a draft requisition                              | Bearer token and company context | `pr:create`                 |
| POST   | `/api/PurchaseRequisition/:requisitionId/submit`   | Submit a draft requisition                              | Bearer token and company context | `pr:submit` plus authorship |
| POST   | `/api/PurchaseRequisition/:requisitionId/cancel`   | Cancel a draft/submitted requisition                    | Bearer token and company context | `pr:cancel` plus authorship |
| POST   | `/api/PurchaseRequisition/:requisitionId/resubmit` | Create a new draft revision from a rejected requisition | Bearer token and company context | `pr:submit` plus authorship |
| GET    | `/api/PurchaseRequisition/`                        | List requisitions                                       | Bearer token and company context | `pr:read`                   |
| GET    | `/api/PurchaseRequisition/:requisitionId`          | Retrieve requisition details                            | Bearer token and company context | `pr:read`                   |
| PATCH  | `/api/PurchaseRequisition/:requisitionId`          | Update an owned draft                                   | Bearer token and company context | `pr:update` plus authorship |

## 5. Detailed Endpoint Contracts

### POST `/api/PurchaseRequisition/create`

**Purpose:** Creates a new draft purchase requisition, its items, and an initial status log.

**Implementation:** Router -> `createRequisition` -> `purchaseRequisitionService.createRequisition` -> `createRequisitionWithItemsAndStatusLog`.

**Request Body:**

```json
{
  "purpose": "Office equipment",
  "justification": "Existing equipment is no longer sufficient for the team.",
  "priority": "NORMAL",
  "currency_code": "USD",
  "needed_by_date": "2026-12-01",
  "items": [
    {
      "item_type": "GOODS",
      "description": "Laptop",
      "specification": "Business laptop",
      "quantity": 2,
      "unit_of_measure": "EA",
      "estimated_unit_cost": 1250,
      "category_id": "category-uuid",
      "needed_by_date": "2026-12-01"
    }
  ]
}
```

`justification` is required, trimmed, 10-500 characters. `purpose` is optional with default `""`, `priority` defaults to `NORMAL`, and `currency_code` defaults to the shared default currency. Dates must be `YYYY-MM-DD`. Items may be supplied as `items` or `line_items`; at least one item is required and input is transformed to `items`. Item type is `GOODS`, `SERVICE`, or `ASSET`; quantity is finite, positive, and has at most four decimal places; estimated unit cost is finite, nonnegative, and has at most four decimal places. Descriptions/specifications/units have schema length limits. Unknown fields are rejected. Several compatibility fields (`requisition_number`, `requester_id`, `company_id`, `request_date`, `requisition_status`, `total_estimated_amount`, `created_by`, `submitted_at`, `remarks`) are accepted by the schema but are not used to set the persisted record.

`workflow_code` is required and must identify an active workflow definition eligible for the authenticated tenant and company. The selected code is persisted on the requisition and is revalidated when the requisition is submitted.

**Success Response:** `201`:

```json
{
  "success": true,
  "message": "Purchase requisition created successfully.",
  "data": {
    "requisition_id": "requisition-uuid",
    "requisition_number": "PR-requisition-uuid-20261021-1",
    "requisition_status": "DRAFT",
    "total_estimated_amount": "2500",
    "currency_code": "USD",
    "created_at": "2026-10-21T12:00:00.000Z",
    "updated_at": "2026-10-21T12:00:00.000Z"
  }
}
```

The response is a controller summary, not the full Prisma record. Total is calculated from item quantity × estimated unit cost; the authenticated user/tenant/company supply requester and ownership fields. Creation and the initial `CREATED` status log occur in one transaction.

**Errors:** `401` for missing authentication/company context; `403` for missing `pr:create`; `404` if the user does not exist; plain membership failure may become `500`; `422` for Zod validation; and `500` for unhandled persistence errors.

### POST `/api/PurchaseRequisition/:requisitionId/submit`

**Purpose:** Submits an owned draft requisition and starts approval processing.

**Path Parameters:** `requisitionId` is required but only validated as a string, not UUID.

**Request Body:** None.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Purchase requisition submitted successfully.",
  "data": {
    "requisition_id": "requisition-uuid",
    "requisition_status": "SUBMITTED",
    "submitted_at": "2026-10-21T12:00:00.000Z"
  }
}
```

**Errors:** `404` if missing; `403` for tenant/company mismatch, inactive membership, or non-owner; `409` unless current status is `DRAFT`; `401`, `422`, or `500` as shared.

**Business Rules and Side Effects:** The requisition must belong to the authenticated tenant/company and requester. It updates status and `submitted_at`, writes a `SUBMITTED` status log transactionally, then publishes `purchaseRequisition.submitted` with tenant/company/user/entity/submission context. `entityType` is populated from `purpose`.

### POST `/api/PurchaseRequisition/:requisitionId/cancel`

**Purpose:** Cancels an owned draft or submitted requisition.

**Path Parameters:** Required non-empty string; no UUID validation.

**Request Body:**

```json
{ "remarks": "No longer required." }
```

`remarks` is required by the schema, trimmed, and maximum 500 characters; it is not nullable.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Purchase resquisition cancelled successfully.",
  "data": {
    "requisition_id": "requisition-uuid",
    "requisition_status": "CANCELLED"
  }
}
```

**Errors:** `404` if missing; `403` for scope, inactive membership, or authorship failure; `409` unless status is `DRAFT` or `SUBMITTED`; `422` for invalid/missing remarks; `401` or `500` as shared. Missing membership is a plain error and may become `500`.

**Side Effects:** Updates status and `cancelled_at`, writes a `CANCELLED` status log with remarks transactionally, and publishes `purchaseRequisition.cancelled`. The event publication is not awaited.

### POST `/api/PurchaseRequisition/:requisitionId/resubmit`

**Purpose:** Creates a new draft revision for an owned rejected requisition.

**Path Parameters:** Required non-empty string; no UUID validation.

**Request Body:** Same purchase-requisition input shape as create, including required justification and at least one item. `remarks` is optional and max 500 characters. `items` or `line_items` is normalized to `items`.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Purchase requisition successfully submitted",
  "data": {
    "requisition_id": "new-revision-uuid",
    "requisition_status": "DRAFT",
    "submitted_at": null
  }
}
```

**Errors:** `404` for absent user/requisition/latest revision; `403` for scope, membership, or authorship failure; `409` unless latest revision is `REJECTED`; `422` for invalid body; `401` or `500` as shared. Membership failures may be generic `500`.

**Business Rules and Side Effects:** The service finds the latest generation by `root_id`, requires `REJECTED`, increments generation, creates a new UUID/PR number, preserves the root ID, stores a new draft and items, and writes a `RESUBMITTED` status log. The rejected revision is not overwritten. No resubmission event is published by this method.

### GET `/api/PurchaseRequisition/`

**Purpose:** Lists requisition summaries for the authenticated tenant/company.

**Query Parameters:** `status` optional: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, or `CANCELLED`; `requesterId` optional UUID; `pr_number` optional non-empty trimmed string; `referenceNo` is an accepted alias transformed to `pr_number`. No pagination parameters exist.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Purchase requisitions retrieved successfully.",
  "data": {
    "purchase_requisitions": [
      {
        "requisition_id": "requisition-uuid",
        "requisition_number": "PR-requisition-uuid-20261021-1",
        "workflow_code": "PURCHASE_REQUISITION",
        "requisition_status": "DRAFT",
        "total_estimated_amount": "2500",
        "currency_code": "USD",
        "created_at": "2026-10-21T12:00:00.000Z",
        "updated_at": "2026-10-21T12:00:00.000Z"
      }
    ],
    "total": 1
        "workflow_code": "PURCHASE_REQUISITION",
      {
}
```

        "workflow_code": "PURCHASE_REQUISITION",

The repository returns at most 10 rows ordered by `updated_at` descending; `total` is an unbounded count matching the filters. The controller maps each row to the summary fields above.

**Errors:** `401` for missing company context; `403` is not explicitly thrown for membership, but missing active membership is a plain error and becomes `500`; `422` for invalid query; `401`/`403` middleware failures and generic `500` remain possible.

### GET `/api/PurchaseRequisition/:requisitionId`

**Purpose:** Retrieves full requisition detail, items, requester, company, and status logs.

**Path Parameters:** Required string; no UUID validation.

**Success Response:** `200` with `data` containing the selected detail fields plus compatibility aliases:

```json
{
  "success": true,
  "message": "Purchase requisition retrieved successfully.",
  "data": {
    "id": "requisition-uuid",
    "pr_number": "PR-requisition-uuid-20261021-1",
    "requested_by_user_id": "user-uuid",
    "status": "DRAFT",
    "items": [],
    "requested_by_user": {},
    "company": {},
    "status_logs": [],
    "requisition_id": "requisition-uuid",
    "requisition_number": "PR-requisition-uuid-20261021-1",
    "requester_id": "user-uuid",
    "requisition_status": "DRAFT",
    "line_items": []
  }
}
```

The repository selects fields including purpose, justification, priority, currency, amounts, dates/status timestamps, ordered items, full requester/company relations, and status logs ordered newest first. Exact nested Prisma fields follow the schema/runtime serialization.

**Errors:** `401` for missing company context; `403` for tenant/company mismatch; `404` for missing requisition/user/detail; generic `500` for missing active membership; `422` for malformed path only if schema parsing rejects it (the current schema accepts any string).

### PATCH `/api/PurchaseRequisition/:requisitionId`

**Purpose:** Updates an owned draft requisition.

**Path Parameters:** Required string; no UUID validation.

**Request Body:**

```json
{
  "purpose": "Updated purpose",
  "justification": "Updated justification with enough detail.",
  "priority": "HIGH",
  "needed_by_date": "2026-12-15",
  "items": [
    {
      "item_type": "GOODS",
      "description": "Laptop",
      "specification": "Updated specification",
      "quantity": 3,
      "unit_of_measure": "EA",
      "estimated_unit_cost": 1200
    }
  ],
  "remarks": "Updated before submission."
}
```

All fields are optional and the schema does not require at least one. `line_items` is an alias for `items`; `request_date` is an alias for `needed_by_date`; `total_estimated_amount` and `remarks` validate but are not persisted by the repository. Item arrays replace the existing item set. Item validation matches create.

**Success Response:** `200` with `{ "success": true, "message": "Purchase requisition updated successfully.", "data": <summary> }`.

**Errors:** `404` for missing requisition/user; `403` for scope, inactive membership, or non-owner; `409` unless status is `DRAFT`; `422` for invalid body; `401` or `500` as shared.

**Business Rules and Side Effects:** Only the requester may update a draft. Header and item replacement occur in one transaction; existing items are deleted and supplied items recreated with sequential line numbers. Status remains `DRAFT`; no event or status log is created.

## 6. Shared Data Structures and Enums

### Status and priority values

Statuses: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`. Priorities: `LOW`, `NORMAL`, `HIGH`, `URGENT`. Item types: `GOODS`, `SERVICE`, `ASSET`.

### Requisition and item records

The database requisition includes UUID `id`, UUID `root_id`, tenant/company/requester IDs, generated `pr_number`, integer `generation`, purpose/justification, status/priority, currency, Decimal total, lifecycle dates, and timestamps. Items include line number, type, description/specification, Decimal quantity/unit/total costs, optional category/date, status, and timestamps.

### Status log

Status logs include from/to status, action, acting user, optional remarks, acted time, and JSON metadata. Creation, submit, cancel, and resubmit persistence uses status logs; update does not.

## 7. Cross-Endpoint Business Rules

- Tenant/company scope is derived from the authenticated context and enforced in service checks and list/detail queries.
- Mutations require an active company membership and requester authorship, except initial creation which uses the authenticated requester.
- New requisitions start as `DRAFT`; only drafts may be updated or submitted.
- Only drafts and submitted requisitions may be cancelled.
- Resubmission requires the latest root revision to be `REJECTED`; it creates a new draft revision and preserves prior records.
- Creation and updates compute totals from item quantities and estimated unit costs rather than trusting `total_estimated_amount`.
- Creation, resubmission, and status transitions use Prisma transactions with item/status-log work where applicable.
- `PurchaseRequisition` has a tenant/PR-number uniqueness constraint; items are unique by requisition/line number; related approval/RFQ/PO records depend on the requisition.
- Submission emits `purchaseRequisition.submitted`, which the Approval Workflow module consumes. Cancellation emits `purchaseRequisition.cancelled` without awaiting publication.

## 8. Frontend Integration Notes

- Use `/api/PurchaseRequisition`, not the legacy `/api/purchase_requisitions` path.
- Send exact enum values in uppercase and use ISO date strings. Path IDs are accepted as strings but should be UUIDs for database compatibility.
- Creation accepts `items` or `line_items`; update accepts either alias; the service normalizes these fields.
- List results are capped at 10, with an unbounded `total`; no page/offset API exists.
- Responses are mostly wrapped in `data`, but the detail response contains both Prisma field names and compatibility aliases. Summary responses do not expose items.
- Handle direct permission `403` responses separately from shared validation/auth/error wrappers.
- The frontend cannot directly set requester, company, status, PR number, total, or submitted timestamp; authenticated context and service rules control those values.
- Submission may trigger asynchronous approval-workflow processing after the HTTP response path.

## 9. Contract Gaps and Implementation Discrepancies

1. **The requested location is stale.** The target is `purchase_requisition`, while the prompt names the Approval Workflow directory. This contract is stored in the actual target module directory.
2. **The legacy API design is stale.** It uses `/api/purchase_requisitions`, different field names, and endpoints/methods not matching the live `/api/PurchaseRequisition` router.
3. **Path IDs are not UUID-validated.** Malformed non-empty IDs reach Prisma and may produce generic `500` errors rather than `422` validation responses.
4. **Several request fields are compatibility-only.** Create/update schemas accept fields such as `total_estimated_amount`, `remarks`, `company_id`, and status identifiers that are ignored or not persisted.
5. **Membership failures are plain errors in several service methods.** Missing active membership can therefore become generic `500` rather than a structured authorization response.
6. **Cancellation event publication is not awaited.** The requisition is committed and the HTTP response can succeed even if event delivery later fails.
7. **Repository update writes narrow by ID after scoped service checks.** Concurrent scope changes are not explicitly guarded in the final update/status write.
8. **Resubmission does not publish a submission event.** It creates a `DRAFT` revision and requires a separate submit request before approval processing begins.
9. **The `entityType` submitted to approval is derived from `purpose`.** This is the implemented event behavior, but it may not represent a stable entity type.

## 10. Verification Summary

- **Verified endpoints:** 7 live router registrations.
- **Routes accounted for:** all POST, GET, and PATCH registrations in `purchaseRequisitionRouter.ts`, combined with `/api` and `/PurchaseRequisition` mounts in `app.ts`.
- **Layers inspected:** application bootstrap, router, controller, service, repository, validators, event integration, authentication, authorization, permission seeds, shared errors, Prisma requisition models, and legacy API/design documents.
- **Internal behavior inspected:** transactional creation/status logs, submission and cancellation events, rejected-revision resubmission, item replacement on update, totals, active membership, authorship, and status transitions.
- **Runtime testing:** not performed. This contract is based on static source inspection; no data-changing requests were issued.
- **Unresolved questions:** deployed case-sensitive route behavior, exact Decimal/Date JSON serialization, and database behavior for malformed IDs/constraint failures require runtime verification.
- **Files changed:** only `backend/src/modules/purchase_requisition/api_contract.md` for this task. No application source, frontend, Prisma schema, or migration files were modified.
