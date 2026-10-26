# Audit Trail API Contract

## 1. Overview

The Audit Trail module records POM procurement events, stores an immutable event or purchase-order snapshot, hashes the snapshot with SHA-256, anchors the hash through the existing blockchain adapter, and exposes authorized listing, lookup, and integrity-verification endpoints.

The live module is mounted at `/api/auditTrail`. The application uses Hono and applies CORS, secure headers, logging, and the shared error handler. The audit router applies `criticalRateLimit` and Bearer-token authentication to all routes, followed by route-specific permission checks.

Audit creation is internal: `purchase-order.audit` is subscribed to during application setup and invokes the service. The legacy `purchase-order.completed` subscription remains supported. There is no registered public HTTP endpoint for creating an audit record.

## 2. Implementation References

### Router and application mounting

- `backend/src/app.ts`: creates the `/api` base path, constructs the audit service, registers audit events, and mounts the router at `/auditTrail`.
- `backend/src/modules/audit_trail/auditTrailRouter.ts`: registers the three reachable GET routes and inherited middleware.

### Controller

- `backend/src/modules/audit_trail/auditTrailController.ts`: reads authenticated context and request parameters, invokes Zod schemas, calls the service, and constructs success responses.

### Service

- `backend/src/modules/audit_trail/auditTrailService.ts`: applies pagination, maps BigInt block numbers for list responses, checks tenant/company access, computes snapshot hashes, calls the blockchain adapter, and returns integrity results.

### Repository

- `backend/src/modules/audit_trail/auditTrailRepository.ts`: scopes RFQ, quotation, and purchase-order records to the authenticated company, selects response fields, builds purchase-order snapshots, and persists audit/hash/blockchain-reference records.
- `backend/src/modules/audit_trail/auditTrailEventHandler.ts`: subscribes to POM audit events and invokes internal audit creation.

### Validation schemas

- `backend/src/modules/audit_trail/auditTrailValidator.ts`: defines UUID validation for audit/user/tenant/company IDs and list filtering/pagination validation.

### Authentication and authorization

- `backend/src/shared/middleware/authenticate.ts`: validates the Bearer JWT and backing session, then sets `c.var.user`.
- `backend/src/shared/Authorization/authorize.ts`: resolves the user's tenant-level role and checks the requested permission; `ORGANIZATION_ADMIN` bypasses individual permission membership.
- `backend/src/shared/Authorization/seeds/systemPermissions.ts`: defines `audit_trail:search` and `audit_trail:verify`.

### Prisma, events, and blockchain

- `backend/prisma/schema.prisma`: `AuditTrail`, `AuditTrailHash`, `AuditTrailBlockchainRef`, `PurchaseOrder`, `PurchaseOrderItem`, and related tenant/company/user models.
- `backend/src/shared/blockchain/blockchainAdapter.ts`: hashes audit IDs to bytes32 for blockchain calls and returns anchored records.

### Shared response and error handling

- `backend/src/shared/middleware/errorHandler.ts`: converts Zod errors to `422 INVALID DATA`, serializes `AppError` instances, and returns a generic `500` for unhandled errors.
- `backend/src/shared/errors/appError.ts`: defines authentication, not-found, authorization, validation, and other error status/code mappings.

## 3. Authentication and Authorization

Every audit route requires:

```http
Authorization: Bearer <access-token>
```

The HS256 access token must contain non-empty `user_id`, `session_id`, and `tenant_id`; `company_id` is optional at authentication middleware level. The session must match the token user and tenant, be unrevoked and unexpired, and belong to an active user.

The controller then requires `company_id` in the authenticated context. If absent, it throws `NotFoundError("User does not belong to a company")`, resulting in `404`, despite this being an access-context failure.

Permissions:

| Operation               | Permission           |
| ----------------------- | -------------------- |
| List audit records      | `audit_trail:search` |
| Search one audit record | `audit_trail:search` |
| Verify audit integrity  | `audit_trail:verify` |

Permission failures return a direct `403` response:

```json
{ "message": "Forbidden" }
```

This differs from authentication and service errors, which use the shared `{ success: false, error: ... }` wrapper.

## 4. Endpoint Inventory

| Method | Effective Path                    | Purpose                                                       | Authentication                   | Authorization        |
| ------ | --------------------------------- | ------------------------------------------------------------- | -------------------------------- | -------------------- |
| GET    | `/api/auditTrail/`                | List purchase-order audit records with filters and pagination | Bearer token and company context | `audit_trail:search` |
| GET    | `/api/auditTrail/search`          | Retrieve one purchase-order audit and its blockchain record   | Bearer token and company context | `audit_trail:search` |
| GET    | `/api/auditTrail/:auditId/verify` | Recompute and compare database and blockchain hashes          | Bearer token and company context | `audit_trail:verify` |

The router-local list path is `/`; the effective registered path is `/api/auditTrail/`. Hono behavior for omitting the trailing slash should be confirmed against the deployed runtime.

## 5. Detailed Endpoint Contracts

### GET `/api/auditTrail/`

**Purpose:** Lists audit records whose entity IDs belong to purchase orders in the authenticated tenant and company.

**Implementation:** `auditTrailRouter.ts` -> `auditTrailController.listAuditRecords` -> `AuditTrailService.listAudits` -> `AuditTrailRepository.listAudits`.

**Authentication:** Valid Bearer access token and a `company_id` in the authenticated context.

**Authorization:** `audit_trail:search`.

**Query Parameters:**

| Name          | Type    | Required | Constraints/default                         | Behavior                    |
| ------------- | ------- | -------- | ------------------------------------------- | --------------------------- |
| `entity_type` | string  | No       | Trimmed, at least 1 character when supplied | Filters audit `entity_type` |
| `action`      | string  | No       | Trimmed, at least 1 character when supplied | Filters audit `action`      |
| `result`      | string  | No       | Trimmed, at least 1 character when supplied | Filters audit `result`      |
| `page`        | integer | No       | Coerced from input, minimum 1, default `1`  | Calculates offset           |
| `page_size`   | integer | No       | Coerced from input, 1-100, default `25`     | Controls page size          |

The controller adds authenticated `user_id`, `tenant_id`, and `company_id` to the schema input; clients do not send those values. No sorting parameter is supported. Results are ordered by `created_at` descending.

**Request Example:**

```http
GET /api/auditTrail/?entity_type=PURCHASE_ORDER&action=COMPLETED&result=SUCCESS&page=1&page_size=25
Authorization: Bearer <access-token>
```

**Success Responses:** `200` with the success wrapper and pagination metadata.

```json
{
  "success": true,
  "message": "Audit trails retrieved successfully",
  "data": {
    "audit_trails": [
      {
        "id": "audit-uuid",
        "entity_type": "PURCHASE_ORDER",
        "entity_id": "purchase-order-uuid",
        "action": "COMPLETED",
        "result": "SUCCESS",
        "created_at": "2026-10-21T12:00:00.000Z",
        "actor_user_id": "user-uuid",
        "hash": {
          "hash_algorithm": "SHA-256",
          "hash_value": "abc123..."
        },
        "blockchain_ref": {
          "blockchain_transaction_hash": "0x...",
          "block_number": "12345",
          "anchored_at": "2026-10-21T12:00:00.000Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 25,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

The repository selects only the fields shown. `blockchain_ref.block_number` is explicitly converted from Prisma `BigInt` to a string, or `null` when the selected value is null. `hash` and `blockchain_ref` are nullable relationships and are returned as `null` when absent. The exact JSON serialization of other date values follows the runtime serializer.

**Error Responses:**

- `403`: `{ "message": "Forbidden" }` when `audit_trail:search` is unavailable.
- `404` with error code `NOT FOUND` and message `User does not belong to a company` when authenticated company context is absent.
- `422` with error code `INVALID DATA` and message `Validation failed` when a filter or pagination value fails Zod validation. Development mode may include field details.
- `401` with the shared error wrapper for missing, malformed, invalid, expired, revoked, or mismatched authentication tokens.
- `500` with `{ "success": false, "error": { "code": "INTERNAL_SERVER_ERROR", "message": "something went wrong" } }` for unhandled repository/database errors.

**Business Rules:** The repository first finds purchase orders by both `tenant_id` and `company_id`, then restricts audit records by tenant and those purchase-order IDs. The endpoint is therefore purchase-order-specific even though filters accept arbitrary strings.

**Side Effects:** None; this endpoint only reads records.

### GET `/api/auditTrail/search`

**Purpose:** Retrieves one purchase-order audit record and the corresponding blockchain record.

**Implementation:** `auditTrailRouter.ts` -> `auditTrailController.searchAuditRecord` -> `AuditTrailService.searchAudit` -> `AuditTrailRepository.findAuditByid` and `BlockchainAdapter.getAudit`.

**Authentication:** Valid Bearer access token and company context.

**Authorization:** `audit_trail:search`.

**Query Parameters:**

| Name       | Type        | Required | Constraints          |
| ---------- | ----------- | -------- | -------------------- |
| `audit_id` | UUID string | Yes      | Must be a valid UUID |

The controller adds authenticated `user_id`, `tenant_id`, and `company_id` before validating. These are not client-supplied query parameters.

**Request Example:**

```http
GET /api/auditTrail/search?audit_id=audit-uuid
Authorization: Bearer <access-token>
```

**Success Responses:** `200`.

```json
{
  "success": true,
  "message": "Purchase Order Found",
  "data": {
    "audit": {
      "id": "audit-uuid",
      "tenant_id": "tenant-uuid",
      "actor_user_id": "user-uuid",
      "entity_type": "PURCHASE_ORDER",
      "entity_id": "purchase-order-uuid",
      "action": "COMPLETED",
      "result": "SUCCESS",
      "request_id": null,
      "snapshot_json": {},
      "created_at": "2026-10-21T12:00:00.000Z"
    },
    "blockchain": {
      "auditId": "0x...",
      "hashValue": "abc123...",
      "eventType": "COMPLETED",
      "anchoredAt": 1761048000
    }
  }
}
```

The audit query returns the full `AuditTrail` row without explicitly loading hash or blockchain relations. The blockchain object is fetched from the adapter and has the fields shown. `hashValue` is normalized by removing a leading `0x` and lowercasing.

**Error Responses:**

- `400` or `422` depending on the shared error mapping/version when `audit_id` is absent or not a UUID; the intended Zod conversion is `422 INVALID DATA` with `Validation failed`.
- `401` with `You do not belong to this organization` when the loaded user does not exist or has a different tenant than the authenticated tenant.
- `403` with `{ "message": "Forbidden" }` for missing search permission.
- `404` with `Audit trail not found` when the audit is absent, not a purchase-order audit, or its purchase order is outside the authenticated company; `User does not belong to a company` applies before service execution when context is absent.
- `500` for unhandled database or blockchain adapter errors. The module does not convert blockchain unavailability to `503`.

**Business Rules:** The audit must have `entity_type: "PURCHASE_ORDER"`, match the authenticated tenant, and reference a purchase order in the authenticated company. The user check only compares tenant membership; company authorization is enforced through the referenced purchase order lookup.

**Side Effects:** None; blockchain retrieval is read-only from the module perspective.

### GET `/api/auditTrail/:auditId/verify`

**Purpose:** Verifies that the current purchase-order snapshot matches the stored SHA-256 hash and the blockchain-anchored hash.

**Implementation:** `auditTrailRouter.ts` -> `auditTrailController.verifyAuditIntegrity` -> `AuditTrailService.auditIntegrity` -> repository snapshot/audit queries and `BlockchainAdapter.getAudit`.

**Authentication:** Valid Bearer access token and company context.

**Authorization:** `audit_trail:verify`.

**Path Parameters:** `auditId` is required and must be a UUID according to `auditIntegritySchema`.

**Request Example:**

```http
GET /api/auditTrail/audit-uuid/verify
Authorization: Bearer <access-token>
```

**Success Responses:** `200` with one of the following service results.

When the fresh snapshot hash differs from the stored hash:

```json
{
  "success": true,
  "data": {
    "status": "INVALID",
    "reason": "Database snapshot has changed"
  }
}
```

When the database snapshot matches and the event was not selected for blockchain anchoring, the service returns `UNANCHORED` (or `ANCHOR_FAILED` when an anchoring attempt failed):

```json
{
  "success": true,
  "data": {
    "status": "UNANCHORED",
    "databaseHash": "abc123...",
    "currentHash": "abc123..."
  }
}
```

For an anchored event, the blockchain comparison result is returned:

```json
{
  "success": true,
  "data": {
    "status": "VALID",
    "databaseHash": "abc123...",
    "currentHash": "abc123...",
    "blockchainHash": "abc123..."
  }
}
```

If the stored hash differs from the blockchain hash, the same shape is returned with `status: "INVALID"`; no `reason` is included in this branch.

**Error Responses:**

- `401` for invalid authentication or `You do not belong to this organization` when the user is missing or belongs to another tenant.
- `403` with `{ "message": "Forbidden" }` for missing `audit_trail:verify` permission.
- `404` for `audit not found`, missing audit hash data, or `purchase order snapshot not found`.
- `422 INVALID DATA` for a non-UUID `auditId`.
- `500` for unhandled database or blockchain adapter errors; no explicit `503` mapping is implemented.

**Business Rules:** The audit must be a purchase-order audit in the authenticated tenant and reference a purchase order in the authenticated company. The record must have a stored hash. Intermediate lifecycle records may legitimately have no blockchain reference and return `UNANCHORED`; completed records return `VALID` or `INVALID` after blockchain comparison. The current snapshot includes purchase order, company, supplier, items, approval actions, and the first goods receipt, and is hashed by JSON serialization followed by SHA-256.

**Side Effects:** None; verification only reads the database and blockchain adapter.

## 6. Shared Data Structures and Enums

### List audit record

The list projection contains `id`, `entity_type`, `entity_id`, `action`, nullable `result`, `created_at`, nullable `actor_user_id`, nullable `hash`, and nullable `blockchain_ref`. The hash projection contains `hash_algorithm` and `hash_value`. The blockchain projection contains `blockchain_transaction_hash`, `block_number`, and `anchored_at`.

### Integrity result

`status` is `UNANCHORED`, `ANCHOR_FAILED`, `VALID`, or `INVALID` in the implemented service. Database-snapshot mismatch includes `reason: "Database snapshot has changed"`; blockchain mismatch does not include a reason. Hash fields are lowercase hexadecimal strings without a leading `0x` after adapter normalization.

### Internal audit values

The implemented event handler creates records with `entity_type: "PURCHASE_ORDER"`, `action: "COMPLETED"`, and initially `result: null`. Successful anchoring updates `result` to `SUCCESS`; anchoring failure attempts to update it to `FAILED` and then rethrows the blockchain error.

## 7. Cross-Endpoint Business Rules

- All public reads require authentication, route permission, tenant context, and company context.
- Audit listing is restricted to purchase orders in the authenticated tenant/company before audit filters are applied.
- Single-record search and verification require the audit to be a `PURCHASE_ORDER` audit and its referenced purchase order to belong to the authenticated company.
- Audit records are created internally after `purchase-order.completed`; clients cannot create or mutate audit records through this module.
- A snapshot is generated from the purchase order and related company, supplier, items, goods receipts, and approval actions. Decimal quantities/prices are converted to numbers in the snapshot.
- The audit hash and blockchain reference are one-to-one with the audit record in Prisma. Hash values are unique, and blockchain transaction hashes are indexed but not declared unique.
- Audit, hash, and blockchain-reference records are tenant-scoped in Prisma, but the verification snapshot query itself looks up the purchase order by ID without independently adding tenant/company predicates after the scoped audit lookup.

## 8. Frontend Integration Notes

- Use `/api/auditTrail`, not the legacy `/api/audit-trails` paths in the design document.
- Send `Authorization: Bearer <access-token>` and use a token with a company context; missing company context currently returns `404`, not `401`.
- List results are paginated with defaults `page=1` and `page_size=25`; `page_size` cannot exceed 100. The response includes `total_pages`.
- Search uses query parameter `audit_id`; it is not a path-based detail endpoint.
- Verification uses the path parameter `auditId` and returns a status-oriented result, not the design document's `integrity_status` field.
- Handle direct `403 { message: "Forbidden" }` separately from shared authentication/validation/error responses.
- Do not expect a public audit-creation request. Completed purchase-order events create records asynchronously through the event bus and blockchain adapter.
- The list endpoint normalizes `block_number` to a string to avoid BigInt JSON serialization problems. Other date and database values follow runtime serialization.

## 9. Contract Gaps and Implementation Discrepancies

1. **The requested path instruction is inconsistent with the target module.** The request names `audit_trail` but says to use the Approval Workflow directory. The existing audit module is `backend/src/modules/audit_trail`; this contract is placed there because documentation belongs inside the target module's folder.
2. **The architecture API document is stale.** It describes `/api/audit-trails`, a public POST creation endpoint, a path-based detail endpoint, and response fields that are not registered or produced by the live router/controller. The live mount is `/api/auditTrail`.
3. **The legacy document claims `503` blockchain errors, but no such mapping is implemented.** Adapter failures propagate to the generic `500` handler.
4. **The list filter accepts arbitrary strings.** Although the current event flow uses `PURCHASE_ORDER`, `COMPLETED`, `SUCCESS`, and `FAILED`, the list schema does not constrain `entity_type`, `action`, or `result` to enums.
5. **Company context failure uses `404`.** Controllers throw `NotFoundError("User does not belong to a company")` when `company_id` is absent rather than an authentication or authorization error.
6. **Search and verification perform user existence/tenant checks but not an explicit company-membership check.** Company isolation is enforced indirectly through the purchase-order lookup for the audit, while `findById` only verifies the user's tenant.
7. **Verification snapshot lookup is broader than the initial audit lookup.** After the audit is scoped by tenant/company, `getPurchaseOrderSnapshot` loads a purchase order by ID alone and then related records without tenant/company predicates. This is a source-level isolation risk if IDs or data relationships are inconsistent.
8. **Audit creation is not an HTTP contract.** The service returns no created response to the event handler. It creates the audit, anchors it, writes hash/reference rows, and updates the result; blockchain failure is rethrown after a best-effort `FAILED` update.
9. **The `blockchain_ref` list field is nullable and its `block_number` is normalized, but search returns a separately fetched blockchain object.** Frontend code must handle these as different response structures.

## 10. Verification Summary

- **Verified endpoints:** 3 live router registrations.
- **Routes accounted for:** list, search, and verification routes in `auditTrailRouter.ts`, combined with `/api` and `/auditTrail` mounts in `app.ts`.
- **Layers inspected:** application bootstrap, router, controller, validator, service, repository, event handler, authentication middleware, authorization middleware, shared error handling, permission seeds, blockchain adapter, Prisma models, and the legacy API design document.
- **Internal behavior inspected:** `purchase-order.completed` event registration, purchase-order snapshot construction, SHA-256 hashing, blockchain anchoring, hash/reference persistence, and audit result updates.
- **Runtime testing:** not performed. This contract is based on static source inspection; no data-changing requests were issued.
- **Unresolved questions:** deployed Hono trailing-slash behavior and exact JSON serialization of all Date/Decimal/BigInt values outside the explicitly normalized list block number require runtime verification.
- **Files changed:** only `backend/src/modules/audit_trail/api_contract.md` for this task. No application source, frontend, Prisma schema, or migration files were modified.
