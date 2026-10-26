# Approval Workflow API Contract

## 1. Overview

The Approval Workflow module manages tenant/company-scoped approval workflow definitions, approval levels, approval requests, and approval decisions. Approval requests are created internally when the event bus receives `purchaseRequisition.submitted`; there is no public submission endpoint in the module router.

The effective public base path is `/api/approval-workflows`. The application uses Hono, mounts the module from `backend/src/app.ts`, and applies CORS, secure headers, logging, and the shared error handler at application/router level. All module routes also apply `authenticate` and `criticalRateLimit` before their route-specific authorization middleware.

All public endpoint success responses use HTTP `200` and the wrapper `{ "success": true, "data": ... }`. Runtime responses are produced by the selected Prisma fields or created Prisma records; the examples below show the verified field shape, with representative UUIDs and timestamps.

## 2. Implementation References

### Router and application mounting

- `backend/src/app.ts`: creates the `/api` base path and mounts the router at `/approval-workflows`.
- `backend/src/modules/approval_workflow/approvalWorkflowRouter.ts`: registers the eight reachable module routes, inherited authentication, rate limiting, and permission middleware.

### Controller

- `backend/src/modules/approval_workflow/approvalWorkflowController.ts`: parses path/query/body input, requires a company context, calls the service, and constructs success responses.

### Service

- `backend/src/modules/approval_workflow/approvalWorkflowService.ts`: resolves active membership, tenant/company scope, workflow levels, role authorization, state transitions, duplicate/range checks, and event publication.

### Repository

- `backend/src/modules/approval_workflow/approvalWorkflowRepository.ts`: performs Prisma reads/writes, selected relationship loading, decision transactions, and internal event-created request persistence.
- `backend/src/modules/approval_workflow/approvalWorkflowEventHandler.ts`: subscribes once to `purchaseRequisition.submitted` and invokes internal approval-request creation.

### Validation schemas

- `backend/src/modules/approval_workflow/approvalWorkflowValidator.ts`: defines the path, query, rejection, level-creation, and workflow-creation Zod schemas.

### Authentication and authorization

- `backend/src/shared/middleware/authenticate.ts`: validates the Bearer JWT, session, tenant, and active user, then sets `c.var.user`.
- `backend/src/shared/Authorization/authorize.ts`: resolves the user role and checks the route permission; `ORGANIZATION_ADMIN` bypasses individual permission membership.
- `backend/src/shared/Authorization/seeds/systemPermissions.ts`: defines the six `approval_workflow:*` permissions used by the router.

### Prisma models and enums/data values

- `backend/prisma/schema.prisma`: `ApprovalRequest`, `ApprovalWorkflowDefinition`, `ApprovalWorkflowLevel`, `ApprovalAction`, `CompanyMembership`, `UserRole`, `Role`, and related purchase requisition models.
- Approval status values used by the implementation: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
- Approval action values used by the implementation: `APPROVED`, `REJECTED`, `CANCELLED`.

### Shared response and error handling

- `backend/src/shared/middleware/errorHandler.ts`: converts Zod errors to `422 INVALID DATA`, serializes `AppError` instances, and returns a generic `500` for other errors.
- `backend/src/shared/errors/appError.ts`: defines the status/code mapping for authentication, authorization, not-found, conflict, validation, and server errors.

## 3. Authentication and Authorization

### Authentication

Every module route is protected by `authenticate`. Send:

```http
Authorization: Bearer <access-token>
```

The token must be an HS256 JWT containing non-empty `user_id`, `session_id`, and `tenant_id`; `company_id` may be absent in the token, but every controller in this module rejects a request without a company context with `401` (`Company context is required.`). The referenced session must exist, match the token user and tenant, not be revoked, not be expired, and belong to an active user.

Route-level permissions are:

| Route operation                 | Permission                          |
| ------------------------------- | ----------------------------------- |
| Create level                    | `approval_workflow:create_level`    |
| Create workflow                 | `approval_workflow:create_workflow` |
| Approve                         | `approval_workflow:approve`         |
| Reject                          | `approval_workflow:reject`          |
| Cancel                          | `approval_workflow:cancel`          |
| List/read/detail/workflow codes | `approval_workflow:read`            |

Missing or invalid permissions return a direct `403` response `{ "message": "Forbidden" }`, without the shared `{ success, error }` wrapper. This is the response returned by `Authorize`.

### Membership and tenant/company scope

The service independently finds the first active `CompanyMembership` for the authenticated user. It derives `tenant_id` from the membership's company and `company_id` from that membership. If no active membership exists, service operations throw `404` with `User has no active company membership`.

Approve, reject, and cancel additionally require a `UserRole` for the user, derived tenant, and derived company. The role's `role_id` must equal the role configured for the request's current workflow level. The route permission alone is not sufficient for those decisions.

## 4. Endpoint Inventory

| Method | Effective Path                                          | Purpose                                               | Authentication                          | Authorization                                             |
| ------ | ------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| POST   | `/api/approval-workflows/create-levels`                 | Create a tenant/company workflow level                | Bearer access token and company context | `approval_workflow:create_level`                          |
| POST   | `/api/approval-workflows/workflows`                     | Create a tenant/company workflow definition           | Bearer access token and company context | `approval_workflow:create_workflow`                       |
| POST   | `/api/approval-workflows/:approval-workflow-id/approve` | Approve the current level                             | Bearer access token and company context | `approval_workflow:approve` plus current-level role match |
| POST   | `/api/approval-workflows/:approval-workflow-id/reject`  | Reject the current level                              | Bearer access token and company context | `approval_workflow:reject` plus current-level role match  |
| POST   | `/api/approval-workflows/:approval-workflow-id/cancel`  | Cancel the pending request                            | Bearer access token and company context | `approval_workflow:cancel` plus current-level role match  |
| GET    | `/api/approval-workflows/`                              | List requests visible at the caller's approval levels | Bearer access token and company context | `approval_workflow:read`                                  |
| GET    | `/api/approval-workflows/workflows`                     | List company-owned workflow definitions               | Bearer access token and company context | `approval_workflow:read`                                  |
| GET    | `/api/approval-workflows/:approval-workflow-id`         | Read one scoped request and its actions               | Bearer access token and company context | `approval_workflow:read`                                  |

The trailing slash on the list route is registered as `/` in the child router. Hono routing behavior for a request without that trailing slash should be confirmed by the deployed runtime; the documented registered path is `/api/approval-workflows/`.

## 5. Detailed Endpoint Contracts

### POST `/api/approval-workflows/create-levels`

**Purpose:** Creates one approval level for a tenant/company workflow.

**Implementation:** `approvalWorkflowRouter.ts` -> `ApprovalWorkflowController.createLevels` -> `ApprovalWorkflowService.createLevel` -> `ApprovalWorkflowRepository`.

**Authentication:** Bearer token, valid session, active user, and company context.

**Authorization:** `approval_workflow:create_level`. The service also requires an active company membership. The route does not perform a separate role/administrator check.

**Request Body:** JSON object:

```json
{
  "workflow_code": "PURCHASE_REQUISITION",
  "level_no": 1,
  "role_code": "DEPARTMENT_MANAGER",
  "min_amount": 0,
  "max_amount": 10000,
  "is_required": true
}
```

Fields are all required. `workflow_code` and `role_code` are strings with no length or format constraint in this schema. `level_no` is an integer greater than zero. `min_amount` and `max_amount` are numbers greater than or equal to zero. `is_required` is boolean. The schema transforms snake_case input to service fields (`workflowCode`, `levelNo`, `roleCode`, `minAmount`, `maxAmount`, `isRequired`).

**Success Responses:** `200` with the Prisma-created level. The exact generated `id` and timestamps are runtime values.

```json
{
  "success": true,
  "data": {
    "id": "level-uuid",
    "tenant_id": "tenant-uuid",
    "company_id": "company-uuid",
    "workflow_id": "workflow-uuid",
    "level_no": 1,
    "role_id": "role-uuid",
    "min_amount": "0",
    "max_amount": "10000",
    "is_required": true,
    "created_at": "2026-10-21T12:00:00.000Z",
    "updated_at": "2026-10-21T12:00:00.000Z"
  }
}
```

Decimal JSON representation is not explicitly normalized by the controller; clients should treat the serialized values as runtime-dependent numeric/decimal values rather than rely on the example's string form.

**Error Responses:**

- `401 UNAUTHORIZED`: missing/invalid token, missing company context, or invalid authentication context.
- `403`: `{ "message": "Forbidden" }` when the route permission is absent.
- `404 NOT FOUND`: `Approval workflow does not exist` or `Approval role does not exist`.
- `409 CONFLICT`: `Workflow level already exists` for a duplicate level number, or an amount-range conflict message.
- `422 INVALID DATA`: Zod validation failure, including non-positive/non-integer level numbers or invalid numeric/boolean types. Service validation errors for negative values or `minAmount > maxAmount` are `400` with their validation error code.
- `500 INTERNAL_SERVER_ERROR`: unhandled Prisma/database or other error, serialized by the shared handler.

**Business Rules:** The referenced workflow must be active and either tenant/company-owned or a system workflow. The role lookup is tenant-scoped. Level numbers are unique per workflow in Prisma, and overlapping ranges are rejected by service logic.

**Side Effects:** Inserts one `ApprovalWorkflowLevel` record. No event is published.

### POST `/api/approval-workflows/workflows`

**Purpose:** Creates a tenant/company-owned workflow definition.

**Implementation:** `approvalWorkflowRouter.ts` -> `ApprovalWorkflowController.createWorkflowDefinition` -> `ApprovalWorkflowService.createWorkflowDefinition` -> `ApprovalWorkflowRepository.createApprovalWorkflowDefinition`.

**Authentication:** Bearer token, valid session, active user, and company context.

**Authorization:** `approval_workflow:create_workflow`. The service contains a TODO for a second service-level permission check; no additional check is implemented.

**Request Body:**

```json
{
  "workflow_code": "PURCHASE_REQUISITION_CUSTOM",
  "name": "Purchase Requisition Custom",
  "description": "Approval flow for custom purchase requisitions",
  "entity_type": "purchase_requisition"
}
```

`workflow_code`, `name`, and `entity_type` are required trimmed strings. `workflow_code` must be 1-100 characters and match uppercase letters, numbers, and underscores. `name` must be 1-150 characters. `entity_type` must be 1-100 characters. `description` is optional, not nullable in the input schema, and if omitted is converted to `null`; when provided it is trimmed and has a maximum length of 1000.

**Success Responses:** `200` with the created workflow. The service sets `tenant_id` and `company_id` from active membership, `is_system` to `false`, and `is_active` to `true`.

```json
{
  "success": true,
  "data": {
    "id": "workflow-uuid",
    "tenant_id": "tenant-uuid",
    "company_id": "company-uuid",
    "workflow_code": "PURCHASE_REQUISITION_CUSTOM",
    "name": "Purchase Requisition Custom",
    "description": "Approval flow for custom purchase requisitions",
    "entity_type": "purchase_requisition",
    "is_system": false,
    "is_active": true,
    "created_at": "2026-10-21T12:00:00.000Z",
    "updated_at": "2026-10-21T12:00:00.000Z"
  }
}
```

**Error Responses:** `401` for authentication/company-context failures; `403` for missing route permission; `404` for no active membership; `409 CONFLICT` with `Workflow code already exists` when the service finds an existing matching workflow; `422 INVALID DATA` for Zod failures; `400` for service-level empty-string validation; and `500` for unhandled errors.

**Business Rules:** The service checks duplicate workflow code through a tenant-scoped lookup, but the Prisma uniqueness constraint is `[tenant_id, workflow_code]`. System fields cannot be supplied by the caller. The repository lookup used for duplicate detection may also find a system definition with the same code.

**Side Effects:** Inserts one `ApprovalWorkflowDefinition` record. No event is published.

### POST `/api/approval-workflows/:approval-workflow-id/approve`

**Purpose:** Records approval at the request's current level. If another configured level exists, the request remains pending and advances to that level; otherwise it becomes approved.

**Implementation:** `approvalWorkflowRouter.ts` -> `ApprovalWorkflowController.approve` -> `ApprovalWorkflowService.approveRequest` -> `ApprovalWorkflowRepository.recordDecision`.

**Authentication:** Bearer token, valid session, active company membership, and company context.

**Authorization:** `approval_workflow:approve`, an active membership, a tenant/company-scoped `UserRole`, and a role ID equal to the current workflow level's role ID.

**Path Parameters:** `approval-workflow-id` is a required string. The schema transforms it to `approvalWorkflowId`; it does not validate UUID format.

**Success Responses:** `200` with the updated `ApprovalRequest` record returned by the transaction. The response does not include requester, purchase requisition, or action relationship data.

```json
{
  "success": true,
  "data": {
    "id": "approval-uuid",
    "tenant_id": "tenant-uuid",
    "company_id": "company-uuid",
    "entity_type": "purchase_requisition",
    "entity_id": "requisition-uuid",
    "requester_user_id": "requester-uuid",
    "current_level": 2,
    "status": "PENDING",
    "submitted_at": "2026-10-21T10:00:00.000Z",
    "resolved_at": null,
    "created_at": "2026-10-21T10:00:00.000Z",
    "updated_at": "2026-10-21T12:00:00.000Z"
  }
}
```

**Error Responses:** `401` for invalid authentication, missing company context, no active membership, or no assigned role; `403` for missing route permission; `404` for an inaccessible request, missing workflow, or missing level; `409 CONFLICT` with `Request is no longer pending`; and `500` for unhandled errors. The transactional update also requires the database row to still be `PENDING`; a concurrent state change may surface as an unhandled database error.

**Business Rules and Side Effects:** An `ApprovalAction` with `action: "APPROVED"` is inserted atomically with the request update. On an intermediate level, status remains `PENDING`, `current_level` advances, and `resolved_at` is cleared. On the final level, status becomes `APPROVED`, `resolved_at` is set, and `approvalWorkflow.approved` is published with the purchase requisition ID, approval request ID, tenant ID, and company ID.

### POST `/api/approval-workflows/:approval-workflow-id/reject`

**Purpose:** Rejects the request at its current approval level.

**Implementation:** `approvalWorkflowRouter.ts` -> `ApprovalWorkflowController.reject` -> `ApprovalWorkflowService.rejectRequest` -> `ApprovalWorkflowRepository.recordDecision`.

**Authentication:** Bearer token, valid session, active membership, and company context.

**Authorization:** `approval_workflow:reject`, plus the current-level role check described in the authentication section.

**Path Parameters:** Required string `approval-workflow-id`; no UUID-format validation.

**Request Body:**

```json
{
  "remarks": "The requested amount exceeds the approved budget."
}
```

`remarks` is required, trimmed, must contain at least one character, and has a maximum length of 1000. It is not nullable.

**Success Responses:** `200` with the updated `ApprovalRequest` record. The rejection remarks are stored on the action, but the returned request record does not contain an action or remarks field.

```json
{
  "success": true,
  "data": {
    "id": "approval-uuid",
    "tenant_id": "tenant-uuid",
    "company_id": "company-uuid",
    "entity_type": "purchase_requisition",
    "entity_id": "requisition-uuid",
    "requester_user_id": "requester-uuid",
    "current_level": 1,
    "status": "REJECTED",
    "submitted_at": "2026-10-21T10:00:00.000Z",
    "resolved_at": "2026-10-21T12:00:00.000Z",
    "created_at": "2026-10-21T10:00:00.000Z",
    "updated_at": "2026-10-21T12:00:00.000Z"
  }
}
```

**Error Responses:** `401`, `403`, `404`, and `409` have the same sources as approve; malformed or missing remarks produce `422 INVALID DATA`. No rejection event is published by the implemented service.

**Side Effects:** Atomically inserts an `ApprovalAction` with `action: "REJECTED"` and the remarks, then updates the request to `REJECTED` with `resolved_at` set.

### POST `/api/approval-workflows/:approval-workflow-id/cancel`

**Purpose:** Cancels a pending request at its current approval level.

**Implementation:** `approvalWorkflowRouter.ts` -> `ApprovalWorkflowController.cancel` -> `ApprovalWorkflowService.cancelRequest` -> `ApprovalWorkflowRepository.recordDecision`.

**Authentication:** Bearer token, valid session, active membership, and company context.

**Authorization:** `approval_workflow:cancel`, plus the current-level role check. The implementation does not separately verify that the caller is the requester.

**Path Parameters:** Required string `approval-workflow-id`; no UUID-format validation.

**Request Body:** None is read by the controller.

**Success Responses:** `200` with the updated `ApprovalRequest` record, with `status: "CANCELLED"` and `resolved_at` set.

**Error Responses:** `401`, `403`, `404`, and `409 CONFLICT` (`Request is no longer pending`) as described for approve. `500` applies to unhandled database or other errors.

**Side Effects:** Atomically inserts an `ApprovalAction` with `action: "CANCELLED"`, then updates the request. No cancellation event is published by the implemented service.

### GET `/api/approval-workflows/`

**Purpose:** Lists up to 20 approval requests in the caller's tenant/company that match the caller's assigned approval role and current level.

**Implementation:** `approvalWorkflowRouter.ts` -> `ApprovalWorkflowController.approvalWorkflow` -> `ApprovalWorkflowService.getApprovalWorkflows` and `countApprovalWorkflows` -> repository list/count queries.

**Authentication:** Bearer token, valid session, active membership, and company context.

**Authorization:** `approval_workflow:read`. The data query is additionally restricted to workflow levels matching the caller's `UserRole`.

**Query Parameters:** `status` is optional. If supplied, it is uppercased before validation and must be `PENDING`, `APPROVED`, `REJECTED`, or `CANCELLED`. No pagination, sorting, search, or approver query parameter is exposed by the controller. The repository always takes 20 records and does not specify ordering.

**Success Responses:** `200`.

```json
{
  "success": true,
  "data": {
    "approval_requests": [
      {
        "id": "approval-uuid",
        "tenant_id": "tenant-uuid",
        "company_id": "company-uuid",
        "entity_type": "purchase_requisition",
        "entity_id": "requisition-uuid",
        "requester_user_id": "requester-uuid",
        "current_level": 1,
        "status": "PENDING",
        "submitted_at": "2026-10-21T10:00:00.000Z",
        "resolved_at": null,
        "created_at": "2026-10-21T10:00:00.000Z",
        "updated_at": "2026-10-21T10:00:00.000Z",
        "requester_user": { "first_name": "Ada", "last_name": "Lovelace" },
        "purchase_requisition": {
          "pr_number": "PR-0001",
          "purpose": "Office equipment",
          "currency_code": "USD",
          "total_amount": "1000"
        }
      }
    ],
    "total": 1
  }
}
```

`total` is the count for the same status and approver-level conditions, but the repository returns `0` immediately when the caller has no matching `UserRole` or no matching configured levels. There is no page metadata.

**Error Responses:** `401` for authentication/context/membership failure; `403` for missing read permission; `422 INVALID DATA` for an invalid status; and `500` for unhandled errors.

### GET `/api/approval-workflows/workflows`

**Purpose:** Lists active workflow definitions owned by the caller's tenant/company.

**Implementation:** `approvalWorkflowRouter.ts` -> `ApprovalWorkflowController.workflowCodes` -> `ApprovalWorkflowService.workflowCodes` -> `ApprovalWorkflowRepository.getWorkflowCodesById`.

**Authentication:** Bearer token, valid session, active membership, and company context.

**Authorization:** `approval_workflow:read`.

**Success Responses:** `200`, with at most 15 records. Only these fields are selected: `workflow_code`, `name`, `description`, `entity_type`, and `is_active`.

```json
{
  "success": true,
  "data": [
    {
      "workflow_code": "PURCHASE_REQUISITION_CUSTOM",
      "name": "Purchase Requisition Custom",
      "description": "Approval flow for custom purchase requisitions",
      "entity_type": "purchase_requisition",
      "is_active": true
    }
  ]
}
```

**Error Responses:** `401` for authentication/context/membership failure; `403` for missing read permission; and `500` for unhandled errors.

**Business Rules:** The repository query filters strictly by `tenant_id` and `company_id`; system definitions have null tenant/company IDs and therefore are not returned by this endpoint.

### GET `/api/approval-workflows/:approval-workflow-id`

**Purpose:** Retrieves one tenant/company-scoped approval request, its selected related requisition/requester data, and its chronological actions.

**Implementation:** `approvalWorkflowRouter.ts` -> `ApprovalWorkflowController.approvalRequest` -> `ApprovalWorkflowService.approvalRequest` -> `ApprovalWorkflowRepository.getApprovalRequestById`.

**Authentication:** Bearer token, valid session, active membership, and company context.

**Authorization:** `approval_workflow:read`. The repository query requires the request ID, derived tenant ID, and derived company ID.

**Path Parameters:** Required string `approval-workflow-id`; no UUID-format validation.

**Success Responses:** `200`.

```json
{
  "success": true,
  "data": {
    "id": "approval-uuid",
    "tenant_id": "tenant-uuid",
    "company_id": "company-uuid",
    "entity_type": "purchase_requisition",
    "entity_id": "requisition-uuid",
    "requester_user_id": "requester-uuid",
    "current_level": 1,
    "status": "PENDING",
    "submitted_at": "2026-10-21T10:00:00.000Z",
    "resolved_at": null,
    "created_at": "2026-10-21T10:00:00.000Z",
    "updated_at": "2026-10-21T10:00:00.000Z",
    "requester_user": { "first_name": "Ada", "last_name": "Lovelace" },
    "purchase_requisition": {
      "pr_number": "PR-0001",
      "purpose": "Office equipment",
      "currency_code": "USD",
      "total_amount": "1000"
    },
    "actions": [
      {
        "id": "action-uuid",
        "action": "APPROVED",
        "remarks": null,
        "acted_at": "2026-10-21T11:00:00.000Z",
        "acted_by_user": { "first_name": "Grace", "last_name": "Hopper" },
        "level": { "level_no": 1 }
      }
    ]
  }
}
```

Actions are ordered ascending by `acted_at`. `404 NOT FOUND` with `Approval request not found` is returned when the request does not exist or is outside the caller's derived tenant/company. Other errors are `401`, `403`, or `500` as described above.

## 6. Shared Data Structures and Enums

### Approval request

The list and detail queries expose `id`, `tenant_id`, `company_id`, `entity_type`, `entity_id`, `requester_user_id`, `current_level`, `status`, `submitted_at`, `resolved_at`, `created_at`, and `updated_at`. List results additionally expose selected requester name and purchase requisition summary. Detail results additionally expose ordered actions with action actor names and level numbers.

### Workflow definition

Creation accepts `workflow_code`, `name`, optional `description`, and `entity_type`. Created responses include generated `id`, tenant/company ownership, `is_system`, `is_active`, and timestamps. Workflow-code listing omits `id`, ownership fields, and timestamps.

### Approval level

Creation accepts workflow code, positive integer level number, role code, nonnegative minimum/maximum amounts, and required flag. Created responses expose the persisted level, workflow/role IDs, ownership, amount bounds, required flag, and timestamps.

### Status and action values

Statuses: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

Actions: `APPROVED`, `REJECTED`, `CANCELLED`.

## 7. Cross-Endpoint Business Rules

- Public request operations are scoped to the first active company membership found for the authenticated user. The request's tenant/company must match that derived scope.
- Approval decisions require the request to be `PENDING` and the caller's tenant/company-scoped role to match the configured role for the current level.
- Approving an intermediate level advances to the next level number found; the service does not require level numbers to be contiguous.
- Final approval sets `APPROVED` and `resolved_at`; rejection and cancellation set their terminal status and `resolved_at`.
- Every decision inserts an action and updates the request in one Prisma transaction.
- Approval requests are created internally from `purchaseRequisition.submitted`, not through a public HTTP endpoint. Existing requests for the same tenant/company/entity are returned instead of creating a second request.
- Internal request creation selects the active workflow by entity type, verifies the purchase requisition belongs to the event tenant/company, and assigns the first level whose amount range contains the requisition total.
- Workflow definitions have a Prisma uniqueness constraint on `(tenant_id, workflow_code)`. Workflow levels have a uniqueness constraint on `(workflow_id, level_no)`.
- System workflow definitions are represented with null tenant/company IDs and `is_system: true`; the list endpoint does not return them.

## 8. Frontend Integration Notes

- Call the effective `/api/approval-workflows` paths, not the older paths in `docs/architecture/APIs/Approval_Workflow.md`. That design document describes unregistered `/submit` and `/status` operations and response formats that do not match the live implementation.
- Send a Bearer access token and ensure the token/session provides a company context. The service uses active membership to determine the actual tenant/company scope.
- Use uppercase status values in filters; lowercase input is uppercased by validation.
- Do not expect pagination controls. The list is capped at 20 records, workflow definitions at 15 records, and neither query exposes an offset/cursor/order parameter.
- Handle two authorization response shapes: route permission failures return `{ "message": "Forbidden" }` with `403`, while authentication and `AppError` failures use `{ "success": false, "error": { "code", "message" } }`.
- Treat list/detail/decision response data as different projections. Decision responses return only the updated request record; detail includes actions and selected relationships.
- Approval requests depend on existing purchase requisitions, active workflow definitions, configured levels, roles, and memberships. The frontend cannot create an approval request directly through this module.

## 9. Contract Gaps and Implementation Discrepancies

1. **The architecture API document is stale.** It documents `/submit`, `/status`, `requestId`, `approverId`, `message` fields, and `201` responses that are not registered or produced by the live router/controller. Frontend integrations must use the eight routes documented here.
2. **The level role lookup does not match the Prisma model shown.** `ApprovalWorkflowRepository.findRoleByCodeAndTenant` queries `role_code`, while `Role` defines `code`. This is a verified source mismatch and may prevent level creation from compiling or executing successfully; the exact runtime outcome is not verified here.
3. **The list `total` is not a general request count.** `countApprovalWorkflowRequests` returns `0` when the caller has no matching role or configured levels, even though the list query without an approver would otherwise count tenant/company requests. The controller always supplies the caller as approver.
4. **System definitions are used by internal workflow lookup but excluded from workflow listing.** `findWorkflowByEntityType` can select a system definition, while `getWorkflowCodesById` filters only exact tenant/company ownership. This means a frontend cannot discover system definitions through the public workflow-code endpoint.
5. **Controller company-context validation and service membership selection are not identical.** The controller checks only that `c.var.user.company_id` is present, but service methods choose the first active membership and do not compare it to the token's `company_id`. The effective data scope is therefore membership-derived.
6. **The service contains an unimplemented extra authorization TODO for workflow creation.** The route permission is enforced, but no separate service-level configuration-role check exists.
7. **Decision action remarks are not returned by decision responses.** Rejection remarks are persisted in `ApprovalAction`, but the update response is the bare `ApprovalRequest` record. Use the detail endpoint to retrieve action remarks.
8. **Exact runtime serialization of Prisma Decimal fields is not established by static inspection.** Amounts appear in examples as decimal strings, but the controller does not explicitly transform them; clients should accommodate the deployed serializer's representation.
9. **Database/Prisma failures are not mapped to module-specific errors.** Unhandled errors receive the generic `500` response. Concurrent decision races and database constraint violations are not converted into a documented `409` by the module.

## 10. Verification Summary

- **Verified endpoints:** 8 live router registrations.
- **Routes accounted for:** all POST and GET registrations in `approvalWorkflowRouter.ts`, combined with `/api` and `/approval-workflows` mounts in `app.ts`.
- **Layers inspected:** application bootstrap, router, controller, validator, service, repository, event handler, authentication middleware, authorization middleware, shared error handler/errors, permission seeds, Prisma schema, and package scripts.
- **Internal behavior inspected:** purchase requisition submission event creates approval requests; decision writes use a Prisma transaction; final approval publishes `approvalWorkflow.approved`.
- **Runtime testing:** not performed. This contract is based on static source inspection; no data-changing requests were issued.
- **Unresolved questions:** deployed Hono trailing-slash behavior, exact Decimal JSON serialization, and the runtime result of the `role_code`/`Role.code` mismatch require compilation or runtime/database verification.
- **Files changed:** only this `api_contract.md` file. No application source, frontend, Prisma schema, or migration files were modified.
