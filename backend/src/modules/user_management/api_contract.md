# User Management API Contract

## 1. Overview

The User Management module exposes authenticated self-profile operations and tenant organization onboarding. The live API base path is `/api/userManagementRouter`. The module does not register public user registration, company lookup, password, or credential endpoints; those concerns are outside the live router.

The router applies Bearer authentication to all three routes. No route-specific `Authorize` middleware is registered. The authenticated token supplies `user_id` and `tenant_id`, and controllers pass those values to the service rather than accepting user identity from the client.

## 2. Implementation References

### Router and application mounting

- `backend/src/app.ts`: creates `/api` and mounts this router at `/userManagementRouter`.
- `backend/src/modules/user_management/userManagementRouter.ts`: registers profile and company-registration routes.

### Controller, service, repository, and validation

- `backend/src/modules/user_management/userManagementController.ts`: extracts authenticated identity, parses request bodies, and creates responses.
- `backend/src/modules/user_management/userManagementService.ts`: performs user existence checks, profile projection, company-registration rules, role assignment, and event publication.
- `backend/src/modules/user_management/userManagementRepository.ts`: performs Prisma user, company, membership, and role operations.
- `backend/src/modules/user_management/userManagementValidator.ts`: defines profile, tax ID, phone, and organization-registration schemas.

### Authentication and shared handling

- `backend/src/shared/middleware/authenticate.ts`: validates the Bearer JWT/session and sets `c.var.user`.
- `backend/src/shared/middleware/errorHandler.ts`: maps Zod errors to `422 INVALID DATA`, serializes `AppError`, and returns generic `500` for unhandled errors.
- `backend/src/shared/errors/appError.ts`: defines authentication, conflict, not-found, validation, and server error mappings.

### Relevant Prisma models

- `backend/prisma/schema.prisma`: `User`, `Company`, `CompanyMembership`, `UserRole`, `Role`, and `Tenant`.
- `backend/src/shared/events/eventBus.ts`: receives the `organization.registered` event after successful company onboarding.

## 3. Authentication and Authorization

All routes require:

```http
Authorization: Bearer <access-token>
```

The HS256 token must contain non-empty `user_id`, `session_id`, and `tenant_id`; an optional `company_id` may also be present. The backing session must match the user and tenant, be active, unrevoked, and unexpired.

No route-specific permission is checked by this module. Authorization is based on the authenticated identity and tenant context. Profile endpoints always operate on the token subject. Company registration is available to any authenticated user who has not already had a membership in the tenant.

## 4. Endpoint Inventory

| Method | Effective Path                                 | Purpose                                                   | Authentication | Authorization                                         |
| ------ | ---------------------------------------------- | --------------------------------------------------------- | -------------- | ----------------------------------------------------- |
| GET    | `/api/userManagementRouter/profile`            | Retrieve authenticated user's profile                     | Bearer token   | Authenticated user identity                           |
| PATCH  | `/api/userManagementRouter/profile`            | Update authenticated user's profile                       | Bearer token   | Authenticated user identity                           |
| POST   | `/api/userManagementRouter/companies/register` | Register a company and assign initial administrator roles | Bearer token   | Authenticated user with no existing tenant membership |

## 5. Detailed Endpoint Contracts

### GET `/api/userManagementRouter/profile`

**Purpose:** Retrieves the profile of the authenticated user.

**Implementation:** Router -> controller `profile` -> `UserManagementService.profile` -> `UserManagementRepository.findById` -> Prisma `User.findUnique`.

**Authentication:** Valid Bearer token/session. No request body or query parameters.

**Authorization:** The service queries by authenticated `user_id` and token `tenant_id`; callers cannot select another user or tenant.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user_id": "user-uuid",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com",
    "job_title": null,
    "status": "ACTIVE",
    "company_name": "Example Company"
  }
}
```

The service returns only the projected fields shown. `company_name` is the display name of the first active company membership returned by the repository, or `null` when no active membership is found. Credentials, sessions, tenant details, and full membership records are not exposed.

**Errors:** `401` for missing/invalid authentication; `404` with `User Not Found` when no user matches the authenticated user and tenant; `500` for unhandled repository errors.

**Side Effects:** None.

### PATCH `/api/userManagementRouter/profile`

**Purpose:** Partially updates the authenticated user's profile.

**Request Body:**

```json
{
  "first_name": "Ada",
  "last_name": "Lovelace",
  "email": "ada@example.com",
  "job_title": "Finance Manager"
}
```

All fields are optional, but at least one must be provided. `first_name` and `last_name` are trimmed strings of 3-40 characters. `email` is trimmed, lowercased, and must be valid. `job_title` is trimmed and 3-40 characters. Unknown fields are not explicitly rejected because the schema is not marked `.strict()`.

**Success Response:** `200` with the same projected profile shape as GET:

```json
{
  "success": true,
  "message": "Profile has been updated successfully",
  "data": {
    "user_id": "user-uuid",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com",
    "job_title": null,
    "status": "ACTIVE",
    "company_name": "Example Company"
  }
}
```

**Errors:** `422 INVALID DATA` for invalid/empty input; `404 User Not Found` if the authenticated user is absent or the update affects no rows; `401` for invalid authentication; duplicate email may produce a database error and generic `500` because no conflict mapping is implemented.

**Business Rules and Side Effects:** The update is always scoped by authenticated user and tenant. The repository uses `updateMany`, then reloads the profile. Status, tenant, memberships, and roles cannot be changed through this endpoint.

**Implementation discrepancy:** The validator and repository accept `job_title`, but the inspected Prisma `User` model does not define `job_title`; `job_title` exists on `CompanyMembership`. This may prevent compilation or make profile updates fail at runtime. The documented response still reflects the service projection, which returns `job_title` as null when absent.

### POST `/api/userManagementRouter/companies/register`

**Purpose:** Registers a new company for the authenticated tenant and assigns the authenticated user as initial organization administrator.

**Request Body:**

```json
{
  "legal_name": "Example Procurement Ltd",
  "display_name": "Example Procurement",
  "tax_id": "123-456-789",
  "address": "123 Example Street, Manila",
  "contact_email": "admin@example.com",
  "contact_phone": "+63-917-123-4567"
}
```

`legal_name` is 3-200 characters and `display_name` is 3-150. `address` is trimmed and 10-300 characters. `contact_email` must be valid. `tax_id` is optional, may contain digits/hyphens, is transformed by removing hyphens, and must contain 9 or 12 digits. `contact_phone` is optional, accepts an optional plus sign and digits/hyphens, then transforms to digits only and must contain 4-15 digits.

**Success Response:** `201`:

```json
{
  "success": true,
  "message": "Company has been successfully registered",
  "data": {
    "companyId": "company-uuid",
    "companyName": "Example Procurement"
  }
}
```

The response exposes only the generated company ID and display name; it does not return the full company record or role IDs.

**Errors:** `401` for invalid authentication; `409 CONFLICT` with `User is already associated with an organization` if any membership exists for the authenticated user in the tenant; `404` for missing user or missing system `ORGANIZATION_ADMIN` role; `422 INVALID DATA` for validation; `500` for transaction/database/event errors.

**Business Rules and Side Effects:** Registration runs in a Serializable Prisma transaction. It creates the company under the authenticated tenant, creates an `ACTIVE` membership, assigns the system role with code `ORGANIZATION_ADMIN` and `tenant_id: null`, creates a `UserRole`, commits all writes, then publishes `organization.registered` with company, tenant, and user IDs. If the system role is missing, no company is created. If event publication fails after commit, the company remains created and the request may return an error.

## 6. Shared Data Structures and Enums

### Profile response

`user_id`, `first_name`, `last_name`, `email`, `job_title`, `status`, and nullable `company_name`. This is a service projection, not a direct Prisma response.

### Organization registration transforms

The request transforms tax IDs to digits-only strings and phone numbers to digits-only strings before persistence. The service persists authenticated tenant/user context rather than client-supplied identity fields.

### Relevant persisted statuses

The authentication middleware requires the user status to be `ACTIVE`. New company memberships are persisted as `ACTIVE`. The user model's status is a string in Prisma; no user-status enum is enforced by this module.

## 7. Cross-Endpoint Business Rules

- User identity and tenant scope always come from the authenticated token.
- Profile operations cannot access or update another user.
- Company registration is allowed only when the user has no existing company membership in the tenant.
- Company, membership, and user-role creation is atomic and uses Serializable isolation.
- Initial organization administration depends on a global system role with code `ORGANIZATION_ADMIN`, `is_system: true`, and `tenant_id: null`.
- Company membership uniqueness is enforced by `(tenant_id, company_id, user_id)`; user email uniqueness is enforced by `(tenant_id, email)`.
- Organization registration emits `organization.registered` only after database writes commit.
- Authentication/registration are separate concerns: user accounts and credentials are created by the authentication module, while this module operates on authenticated users.

## 8. Frontend Integration Notes

- Use `/api/userManagementRouter`, not the legacy `/api/users` and `/api/companies` paths.
- Do not send user IDs, tenant IDs, company IDs, status, or role IDs for profile operations; the backend derives identity from the token.
- Expect profile responses under `data` and company-registration responses under `data` with camelCase `companyId`/`companyName`.
- Send ISO-like date-independent strings for tax/phone inputs; the backend normalizes tax IDs and phone numbers before storage.
- Handle structured `401/404/409/422` errors and generic `500` responses from the shared error handler.
- Company registration may succeed in the database even if the post-commit `organization.registered` event fails.
- The legacy design lists company retrieval and different paths, but those routes are not registered in the live router.

## 9. Contract Gaps and Implementation Discrepancies

1. **The requested documentation location is stale.** The target is `user_management`, while the prompt names the Approval Workflow directory. This contract is stored in the actual target module directory.
2. **The legacy API document is stale.** It documents `/api/companies/register`, `/api/users/profile`, and `GET /api/companies/:companyId`; the live effective prefix is `/api/userManagementRouter` and only the first two operations exist under different paths.
3. **`job_title` is inconsistent with the Prisma `User` model.** The validator, service projection, and repository update use `job_title`, but the inspected schema defines it on `CompanyMembership`, not `User`. Profile updates involving this field may fail compilation/runtime.
4. **No route-level RBAC permission is applied.** Any valid authenticated user can call profile and company-registration routes, subject to service-level membership/duplicate checks.
5. **Registration event failure is post-commit.** Database creation is not rolled back when `organization.registered` publication fails.
6. **Unknown profile fields are not explicitly rejected.** `UpdateUserProfileSchema` is not strict, although only known fields are spread into the repository update object.
7. **Duplicate email conflicts are not mapped.** The tenant/email uniqueness constraint may produce a generic `500` rather than the legacy document's `409`.

## 10. Verification Summary

- **Verified endpoints:** 3 live router registrations.
- **Routes accounted for:** profile GET/PATCH and company registration POST in `userManagementRouter.ts`, combined with `/api` and `/userManagementRouter` mounts in `app.ts`.
- **Layers inspected:** application bootstrap, router, controller, service, repository, validators, authentication middleware, shared errors, Prisma user/company/role models, event publication, and legacy API documentation.
- **Runtime testing:** not performed. This contract is based on static source inspection; no data-changing requests were issued.
- **Unresolved questions:** exact runtime result of the `User.job_title` mismatch, JSON serialization of any nullable values, and database error mapping require compilation/runtime verification.
- **Files changed:** only `backend/src/modules/user_management/api_contract.md` for this task. No application source, frontend, Prisma schema, or migration files were modified.
