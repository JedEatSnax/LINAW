# Purchase Order Management API Contract

## 1. Overview

The Purchase Order Management module manages the procurement queue, requests for quotation (RFQs), supplier quotations, purchase-order creation from a selected quotation, purchase-order updates, and purchase-order/RFQ state transitions.

The live API base path is `/api/purchase-orders`. The application uses Hono and mounts this router from `backend/src/app.ts`. All routes require Bearer authentication and route-level permission authorization. The module also subscribes to internal approval and supplier-quotation events; those event handlers are not HTTP endpoints.

## 2. Implementation References

### Router and application mounting

- `backend/src/app.ts`: creates the `/api` base path and mounts the module at `/purchase-orders`.
- `backend/src/modules/purchase_order_management/purchaseOrderManagementRouter.ts`: registers 15 reachable routes and their permissions.

### Controller, service, repository, and validation

- `backend/src/modules/purchase_order_management/purchaseOrderManagementController.ts`: parses request bodies, queries, and UUID parameters; requires company context; constructs response wrappers.
- `backend/src/modules/purchase_order_management/purchaseOrderManagementService.ts`: enforces procurement and status rules, builds RFQs/POs, counts lists, and publishes events.
- `backend/src/modules/purchase_order_management/purchaseOrderManagementRepository.ts`: performs tenant/company-scoped Prisma reads, transactional supplier selection and updates, and soft cancellation.
- `backend/src/modules/purchase_order_management/purchaseOrderManagementValidator.ts`: defines query, parameter, RFQ, purchase-order, currency, and item schemas.

### Internal event handling

- `backend/src/modules/purchase_order_management/purchaseOrderManagementEventHandler.ts`: subscribes to `approvalWorkflow.approved` and supplier quotation submission events.

### Authentication and authorization

- `backend/src/shared/middleware/authenticate.ts`: validates the Bearer JWT and backing session and sets `c.var.user`.
- `backend/src/shared/Authorization/authorize.ts`: resolves the user's role and checks permissions; `ORGANIZATION_ADMIN` bypasses individual permission membership.
- `backend/src/shared/Authorization/seeds/systemPermissions.ts`: defines the purchase-order permissions.

### Relevant Prisma models and shared errors

- `backend/prisma/schema.prisma`: `PurchaseOrder`, `PurchaseOrderItem`, `RFQ`, `RFQItem`, `RFQSupplierAssignment`, `SupplierQuotation`, `SupplierQuotationItem`, `PurchaseRequisition`, `Supplier`, and related tenant/company models.
- `backend/src/shared/middleware/errorHandler.ts`: converts Zod errors to `422 INVALID DATA`, serializes `AppError` instances, and returns generic `500` responses for other errors.
- `backend/src/shared/errors/appError.ts`: defines the status/code mapping for not-found, conflict, authentication, validation, and server errors.

## 3. Authentication and Authorization

Every route requires:

```http
Authorization: Bearer <access-token>
```

The HS256 token must contain non-empty `user_id`, `session_id`, and `tenant_id`. `company_id` is optional to the authentication middleware, but every controller route in this module requires it and throws `404 User does not belong to a company` when absent. The session must match the token user and tenant, be active, unrevoked, and unexpired.

Route permissions are:

| Operation                                                          | Permission                               |
| ------------------------------------------------------------------ | ---------------------------------------- |
| List/read purchase orders, procurement queue, RFQs, and quotations | `purchase_order:read`                    |
| Create RFQ                                                         | `purchase_order:create_rfq`              |
| Publish/update RFQ                                                 | `purchase_order:update_rfq`              |
| Delete/cancel RFQ                                                  | `purchase_order:delete_rfq`              |
| Select supplier                                                    | `purchase_order:accept_quotation`        |
| Create/order/update/delete purchase order                          | `purchase_order:read` in the live router |

Permission failures return an unwrapped `403` response:

```json
{ "message": "Forbidden" }
```

The service then scopes resource queries by the authenticated `tenant_id` and `company_id`.

## 4. Endpoint Inventory

| Method | Effective Path                                                    | Purpose                                     | Authentication                   | Authorization                     |
| ------ | ----------------------------------------------------------------- | ------------------------------------------- | -------------------------------- | --------------------------------- |
| POST   | `/api/purchase-orders/:poId`                                      | Advance a draft or issued purchase order    | Bearer token and company context | `purchase_order:read`             |
| POST   | `/api/purchase-orders/:poId/complete`                             | Complete an ordered purchase order          | Bearer token and company context | `purchase_order:read`             |
| POST   | `/api/purchase-orders/rfqs`                                       | Create a draft RFQ                          | Bearer token and company context | `purchase_order:create_rfq`       |
| POST   | `/api/purchase-orders/rfqs/:rfqId/publish`                        | Publish a draft RFQ                         | Bearer token and company context | `purchase_order:update_rfq`       |
| POST   | `/api/purchase-orders/rfqs/:rfqId/quotations/:quotationId/select` | Select a supplier quotation and create a PO | Bearer token and company context | `purchase_order:accept_quotation` |
| GET    | `/api/purchase-orders/procurement-queue`                          | List approved requisitions without RFQs     | Bearer token and company context | `purchase_order:read`             |
| GET    | `/api/purchase-orders/`                                           | List purchase orders                        | Bearer token and company context | `purchase_order:read`             |
| GET    | `/api/purchase-orders/rfqs`                                       | List RFQs                                   | Bearer token and company context | `purchase_order:read`             |
| GET    | `/api/purchase-orders/quotations`                                 | List all company quotations                 | Bearer token and company context | `purchase_order:read`             |
| GET    | `/api/purchase-orders/rfqs/:rfqId/quotations`                     | List quotations for an RFQ                  | Bearer token and company context | `purchase_order:read`             |
| GET    | `/api/purchase-orders/rfqs/:rfqId/quotations/:quotationId`        | Retrieve one quotation                      | Bearer token and company context | `purchase_order:read`             |
| GET    | `/api/purchase-orders/:poId`                                      | Retrieve one purchase order                 | Bearer token and company context | `purchase_order:read`             |
| PATCH  | `/api/purchase-orders/rfqs/:rfqId`                                | Update a draft RFQ                          | Bearer token and company context | `purchase_order:update_rfq`       |
| PATCH  | `/api/purchase-orders/:poId`                                      | Update an issued purchase order             | Bearer token and company context | `purchase_order:read`             |
| DELETE | `/api/purchase-orders/rfqs/:rfqId`                                | Cancel a draft RFQ                          | Bearer token and company context | `purchase_order:delete_rfq`       |
| DELETE | `/api/purchase-orders/:poId`                                      | Cancel an eligible purchase order           | Bearer token and company context | `purchase_order:read`             |

The router registers the root child path as `/`; deployed behavior for omitting the trailing slash should be confirmed if clients use `/api/purchase-orders` without `/`.

## 5. Detailed Endpoint Contracts

### POST `/api/purchase-orders/:poId`

**Purpose:** Advances a purchase order through its order lifecycle.

**Implementation:** `purchaseOrderManagementRouter.ts` -> `orderPurchaseOrder` -> `PurchaseOrderManagementService.orderPurchaseOrder` -> `PurchaseOrderManagementRepository.orderPurchaseOrder`.

**Path Parameters:** `poId` is required and must be a UUID.

**Request Body:** None.

**Success Response:** `200` with `createdPO`, containing the purchase order including items and its source relations.

**Errors:** `404` for a missing PO, `409` if the current status cannot advance or a concurrent transition fails, and `500` for unhandled database errors.

**Business Rules:** `DRAFT` advances to `ISSUED`; `ISSUED` advances to `ORDERED`. Other statuses are rejected. The update is guarded by tenant, company, and current status.

### POST `/api/purchase-orders/:poId/complete`

**Purpose:** Transitions an `ORDERED` purchase order to `COMPLETED`.

**Path Parameters:** `poId` is required and must be a UUID. The request body is empty.

**Success Response:** `200` with `completedPO`, containing the completed purchase order and its source relations.

**Errors:** `404` for a missing or out-of-scope PO; `409` unless the PO is `ORDERED` or a concurrent transition fails; `401`, `403`, or `500` as shared.

### POST `/api/purchase-orders/rfqs`

**Purpose:** Creates a draft RFQ from an approved purchase requisition.

**Request Body:**

```json
{
  "purchase_requisition_id": "requisition-uuid",
  "title": "Office equipment quotation",
  "description": "Request for supplier pricing",
  "closing_date": "2026-11-01",
  "items": [
    {
      "line_no": 1,
      "description": "Laptop",
      "quantity": 10,
      "unit_of_measure": "EA",
      "specification": "Business laptop"
    }
  ]
}
```

`purchase_requisition_id` must be a UUID. `title` is trimmed and 1-255 characters. `description` is optional and trimmed with a maximum of 5000 characters; it is not nullable in the input schema. `closing_date` is coerced to a Date. Items may be supplied as `items` or `rfq_items`; at least one array is required and the schema transforms either input to `rfq_items`. Each item requires a positive integer `line_no`, non-empty 1-50 character unit, positive quantity, and trimmed descriptions/specifications up to 5000 characters. `specification` must contain at most 5000 characters but may be empty.

**Success Response:** `201` with `{ "success": true, "message": "Successful", "createRfq": <created RFQ including items> }`.

**Errors:** `404` when the requisition is absent, not approved, lacks `approved_at`, or is outside tenant/company; `409` when it already has an RFQ; `422` for validation; `401`, `403`, or `500` as shared.

**Business Rules and Side Effects:** The requisition must be `APPROVED` and have a non-null approval timestamp. Only one RFQ is allowed per requisition. The service creates status `DRAFT`, a generated RFQ number, tenant/company ownership, creator, and RFQ items.

### POST `/api/purchase-orders/rfqs/:rfqId/publish`

**Purpose:** Publishes a draft RFQ and emits `rfq.published`.

**Path Parameters:** `rfqId` is required and must be a UUID.

**Request Body:** None.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Successfully published RFQS",
  "published": { "message": "RFQ successfully published" }
}
```

**Errors:** `404` for missing RFQ or failed transition; `409` if the RFQ is not `DRAFT`; `422` for invalid UUID; `401`, `403`, or `500` as shared.

**Side Effects:** Updates status to `PUBLISHED`, sets `issue_date`, and publishes the RFQ number, title, description, deadline, and item summaries. Event publication failure propagates after the database update.

### POST `/api/purchase-orders/rfqs/:rfqId/quotations/:quotationId/select`

**Purpose:** Selects a posted supplier quotation and creates a draft purchase order.

**Path Parameters:** `rfqId` and `quotationId` are required UUIDs.

**Request Body:** None.

**Success Response:** `200` with `{ "success": true, "message": "Supplier has been selected", "selectedSupplier": <created draft PurchaseOrder including items> }`.

**Errors:** `404` when RFQ/quotation is absent, mismatched, or outside scope; `409` when RFQ is not `PUBLISHED`, quotation is no longer selectable, or the transaction cannot complete; `422` for invalid IDs; `401`, `403`, or `500` as shared.

**Business Rules and Side Effects:** RFQ must be published; quotation must be `POSTED`, belong to the RFQ/company/tenant, and match an RFQ supplier. The operation is transactional: quotation becomes `SELECTED`, then a `DRAFT` PO and PO items are created from quotation items. A matching supplier assignment is required. Repeated selection is rejected by the posted-status guard.

### GET `/api/purchase-orders/procurement-queue`

**Purpose:** Lists approved purchase requisitions that do not yet have RFQs.

**Query Parameters:** Optional `referenceNo`, trimmed 1-100 characters; filters `pr_number` case-insensitively. Tenant/company are taken from authentication.

**Success Response:** `200` with `{ "success": true, "message": "Success list is returned", "ApprovedPR": [<PurchaseRequisition including items>] }`.

**Errors:** `404` without company context; `422` for invalid query; `401`, `403`, or `500` as shared.

**Business Rules:** Results require `status: "APPROVED"`, non-null `approved_at`, tenant/company scope, and no related RFQ. Ordered by `approved_at` descending. No pagination is implemented.

### GET `/api/purchase-orders/`

**Purpose:** Lists purchase orders with optional status/reference filtering.

**Query Parameters:** `status` optional: `DRAFT`, `ISSUED`, `ORDERED`, `CANCELLED`, or `COMPLETED`. `referenceNo` optional, trimmed 1-100 characters, case-insensitive substring match against `po_number`.

**Success Response:** `200` with `{ "success": true, "message": "Success list is returned", "list": [<PurchaseOrder including items>], "total": number }`. The list is capped at 20 and ordered newest first; `total` is the unbounded matching count.

**Errors:** `404` without company context; `422` for invalid query; `401`, `403`, or `500` as shared.

### GET `/api/purchase-orders/rfqs`

**Purpose:** Lists RFQs.

**Query Parameters:** `status` optional: `DRAFT`, `PUBLISHED`, `CLOSED`, or `CANCELLED`. `purchase_requisition_id` optional UUID.

**Success Response:** `200` with `{ "success": true, "list": [<RFQ including items>], "total": number }`. List is capped at 20 and ordered by `created_at` descending.

**Errors:** `404` without company context; `422` for invalid status/UUID; `401`, `403`, or `500` as shared.

### GET `/api/purchase-orders/quotations`

**Purpose:** Lists all supplier quotations in the authenticated tenant/company.

**Success Response:** `200` with `{ "success": true, "list": [<SupplierQuotation including items, selected RFQ summary, and supplier summary>], "total": number }`.

**Errors:** `404` without company context; `401`, `403`, or `500` as shared. No pagination or filters.

### GET `/api/purchase-orders/rfqs/:rfqId/quotations`

**Purpose:** Lists quotations associated with one RFQ.

**Path Parameters:** `rfqId` UUID.

**Success Response:** `200` with `{ "success": true, "QuotationList": [<SupplierQuotation including items>] }`.

**Errors:** `404` for missing/scoped RFQ; `422` for invalid UUID; `401`, `403`, or `500` as shared.

### GET `/api/purchase-orders/rfqs/:rfqId/quotations/:quotationId`

**Purpose:** Retrieves one quotation belonging to one RFQ.

**Path Parameters:** `rfqId` and `quotationId` UUIDs.

**Success Response:** `200` with `{ "success": true, "Quotation": <SupplierQuotation including items> }`.

**Errors:** `404` if absent, mismatched to RFQ, or outside scope; `422` for invalid IDs; `401`, `403`, or `500` as shared.

### GET `/api/purchase-orders/:poId`

**Purpose:** Retrieves one tenant/company-scoped purchase order with items, source PR/RFQ/quotation, supplier company, and purchasing company details.

**Path Parameters:** `poId` UUID.

**Success Response:** `200` with `{ "success": true, "PO": <PurchaseOrder including items> }`.

**Errors:** `404` if absent/outside scope; `422` for invalid UUID; `401`, `403`, or `500` as shared.

### PATCH `/api/purchase-orders/rfqs/:rfqId`

**Purpose:** Updates a draft RFQ.

**Path Parameters:** `rfqId` UUID.

**Request Body:**

```json
{
  "title": "Updated RFQ title",
  "description": "Updated requirements",
  "closing_date": "2026-11-10",
  "rfq_items": [
    {
      "line_no": 1,
      "description": "Laptop",
      "quantity": 12,
      "unit_of_measure": "EA",
      "specification": "Updated specification"
    }
  ]
}
```

All fields are optional and the schema does not require at least one. `rfq_items`, when supplied, must be a non-empty array with the same item constraints as creation. The service maps only supplied item fields and updates existing rows by RFQ and line number; it does not create missing lines.

**Success Response:** `200` with `{ "success": true, "message": "Sucessful", "updated": <updated RFQ> }`.

**Errors:** `404` for missing RFQ; `409` if not `DRAFT`; `422` for invalid input; `401`, `403`, or `500` as shared.

**Side Effects:** Transactionally updates RFQ header and supplied existing item rows. Missing item line numbers are silently unaffected.

### PATCH `/api/purchase-orders/:poId`

**Purpose:** Updates an issued purchase order’s delivery date, currency, and/or items.

**Path Parameters:** `poId` UUID.

**Request Body:**

```json
{
  "expected_delivery_date": "2026-12-01",
  "currency_code": "USD",
  "items": [
    {
      "line_no": 1,
      "description": "Laptop",
      "quantity": 10,
      "unit_of_measure": "EA",
      "unit_price": 1250
    }
  ]
}
```

All fields are optional and the schema does not require at least one. If items are supplied, the array must be non-empty; quantity is positive, unit price nonnegative, and descriptions/units are constrained. No currency-precision refinement is applied to this update schema.

**Success Response:** `200` with `{ "success": true, "updated": <updated PurchaseOrder including items> }`.

**Errors:** `404` for missing PO; `409` unless status is `ISSUED`; `422` for invalid input; `401`, `403`, or `500` as shared.

**Business Rules and Side Effects:** Transactionally updates supplied existing item rows by line number and recalculates total amount as `sum(quantity * unit_price)`. Missing line numbers are silently unaffected. The repository update itself narrows by PO ID after service scope checking.

### DELETE `/api/purchase-orders/rfqs/:rfqId`

**Purpose:** Cancels a draft RFQ. This is a soft delete.

**Path Parameters:** `rfqId` UUID.

**Success Response:** `200` with `{ "success": true, "deleted": <RFQ with status "CANCELLED"> }`.

**Errors:** `404` if absent; `409` unless status is `DRAFT`; `422` for invalid UUID; `401`, `403`, or `500` as shared.

**Side Effects:** Updates RFQ status to `CANCELLED`; it does not physically delete the RFQ or its items.

### DELETE `/api/purchase-orders/:poId`

**Purpose:** Cancels an eligible purchase order. This is a soft delete.

**Path Parameters:** `poId` UUID.

**Success Response:** `200` with `{ "success": true, "deletedPO": <PurchaseOrder with status "CANCELLED"> }`.

**Errors:** `404` if absent; `409` when status is `ORDERED`, `COMPLETED`, or `CANCELLED`; `422` for invalid UUID; `401`, `403`, or `500` as shared.

**Business Rules:** The service permits cancellation of statuses not in the blocked list, including `DRAFT` and `ISSUED`. It updates status to `CANCELLED` rather than deleting the row.

## 6. Shared Data Structures and Enums

### RFQ

RFQ records contain IDs/tenant/company, `rfq_number`, optional requisition ID, creator ID, title, nullable description, `status`, nullable `issue_date`/`closing_date`, timestamps, and RFQ items. RFQ statuses used by validation and service are `DRAFT`, `PUBLISHED`, `CLOSED`, and `CANCELLED`.

### RFQ item

Items contain IDs, tenant/RFQ IDs, optional requisition-item ID, line number, description, Decimal quantity, unit, nullable specification, and timestamps. `(rfq_id, line_no)` is unique.

### Supplier quotation

Quotation records contain IDs, tenant/company/RFQ/supplier IDs, quotation number, currency, Decimal total, status, optional submission/validity dates, timestamps, and quotation items. Quotations are selected only from status `POSTED`; the supplier event handler changes `SUBMITTED` to `POSTED`.

### Purchase order

PO records contain IDs, tenant/company/supplier/requisition/RFQ/quotation links, PO number, issuer, status, currency, Decimal total, order/expected delivery dates, approval/timestamp fields, and items. The module uses statuses `DRAFT`, `ISSUED`, `ORDERED`, `CANCELLED`, and `COMPLETED`.

### Currency and dates

Creation uses `currencyCodeSchema`, defaults to `DEFAULT_CURRENCY_CODE` when omitted, and checks currency minor-unit precision for total and item prices. Dates are coerced from request values to JavaScript `Date` values. Decimal fields and dates are returned through the runtime Prisma/Hono JSON serialization; no response transformation is performed by the controllers.

## 7. Cross-Endpoint Business Rules

- All resource queries use authenticated tenant/company scope.
- Approved requisitions must have `approved_at` and cannot have an existing RFQ before RFQ creation or procurement-queue inclusion.
- RFQs must be `DRAFT` to update/cancel and must be `DRAFT` to publish.
- Quotations are selectable only when the RFQ is `PUBLISHED`, the quotation is `POSTED`, the quotation belongs to the RFQ and supplier, and a matching RFQ supplier assignment exists.
- Supplier selection and PO creation run in one Prisma transaction and prevent selecting the same quotation twice through the `POSTED` condition.
- Selecting a quotation creates a `DRAFT` PO. POs advance `DRAFT -> ISSUED -> ORDERED -> COMPLETED`; each transition is guarded by the backend.
- Purchase orders must be `ISSUED` to update. PO cancellation is blocked for `ORDERED`, `COMPLETED`, and already `CANCELLED` states.
- RFQ and PO deletion endpoints are soft cancellation operations.
- List endpoints cap PO/RFQ results at 20 but expose a separate unbounded `total`; no page number or offset is supported.
- Internal `approvalWorkflow.approved` handling checks for required event fields and verifies the approved requisition has no RFQ, but the registered event handler passes only `purchaseRequisition_id` and `approvalWorkflow_id`, omitting tenant/company values expected by the service. This internal path may therefore fail as currently wired.

## 8. Frontend Integration Notes

- Use `/api/purchase-orders`, not the legacy `/api/purchase-order` or other paths in the architecture document.
- Use exact response keys: `list`, `total`, `ApprovedPR`, `QuotationList`, `Quotation`, `PO`, `createdPO`, `createRfq`, `published`, `selectedSupplier`, `updated`, `deleted`, and `deletedPO` vary by endpoint; there is no uniform `data` wrapper.
- Send UUIDs for all validated path and body IDs. Invalid UUIDs produce shared `422` responses.
- RFQ creation accepts either `items` or `rfq_items`, but the service receives normalized `rfq_items`; RFQ update accepts only `rfq_items`.
- Do not expect pagination metadata. PO and RFQ list responses are capped at 20 with a separate total count.
- Handle authorization failures as `{ "message": "Forbidden" }`, while service/validation failures use `{ "success": false, "error": ... }`.
- Supplier quotations become `POSTED` from an internal submission event, and only then can the selection endpoint create a PO.
- The root POST ordering endpoint is not reachable as registered because it requires a missing `poId` parameter. The frontend should not rely on it without a backend route correction.

## 9. Contract Gaps and Implementation Discrepancies

1. **The requested documentation location is stale.** The target module is `purchase_order_management`, while the prompt names the Approval Workflow directory. This contract is stored in the actual target module directory.
2. **The legacy API design is stale.** It uses different paths, methods, request fields, and response wrappers than the live router. For example, live quotation detail is nested under `/rfqs/:rfqId/quotations/:quotationId`, and live RFQ updates use `PATCH`, not `PUT`.
3. **The root POST route is inaccessible.** `router.post("/", ..., controller.orderPurchaseOrder)` calls a controller that requires `poId`, but no path parameter is registered. It likely needs `/:poId`; this contract documents the actual unreachable route.
4. **Create/order/update/delete PO permissions are mismatched.** The live router uses `purchase_order:read` for root POST, PO PATCH, and PO DELETE rather than dedicated create/update/cancel permissions. The documented authorization is the implementation, not an inferred intended policy.
5. **Approval event context is incomplete.** `approvedPrIncoming` passes only requisition/workflow IDs to `handleApprovedPurchaseRequisition`, while the service requires tenant/company IDs and rejects missing values. The event-driven approval path may not function as intended.
6. **RFQ update can silently ignore missing item lines.** Repository `updateMany` calls do not verify that each supplied line exists, and the service returns the updated RFQ header.
7. **PO update can silently ignore missing item lines and has no update precision check.** The update recalculates totals from supplied items, but the validator does not apply the creation currency-precision refinement.
8. **Some repository writes repeat only the resource ID after service scope checks.** RFQ/PO updates and cancellations use ID-only writes after an initial scoped read. Concurrent cross-scope changes are not explicitly guarded by tenant/company in those final writes.
9. **Unhandled database and plain errors become generic 500 responses.** Unique, foreign-key, transaction, and event publication failures are not mapped to module-specific response contracts.

## 10. Verification Summary

- **Verified endpoints:** 15 live router registrations.
- **Routes accounted for:** all POST, GET, PATCH, and DELETE registrations in `purchaseOrderManagementRouter.ts`, combined with `/api` and `/purchase-orders` mounts in `app.ts`.
- **Layers inspected:** application bootstrap, router, controller, service, repository, validators, event handlers, authentication, authorization, permission seeds, shared errors, Prisma procurement models, and the legacy API document.
- **Internal behavior inspected:** approval-workflow and supplier-quotation event subscriptions, RFQ publication event, supplier-selection transaction, status transitions, list limits/counts, and soft cancellation.
- **Runtime testing:** not performed. This contract is based on static source inspection; no data-changing requests were issued.
- **Unresolved questions:** deployed trailing-slash behavior, exact Decimal/Date JSON serialization, and database behavior for unique/foreign-key failures require runtime verification.
- **Files changed:** only `backend/src/modules/purchase_order_management/api_contract.md` for this task. No application source, frontend, Prisma schema, or migration files were modified.
