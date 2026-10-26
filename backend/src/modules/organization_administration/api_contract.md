# Organization Administration API Contract

## 1. Overview

The Organization Administration module manages company members, company roles, role permissions, member-role assignments, and company settings. The live router is mounted at `/api/organizationManagement`.

The application uses Hono. The module applies Bearer authentication to all routes; each route also applies a permission-specific authorization middleware. Requests use JSON bodies for create/update/assignment operations. The module has no public organization audit-trail route; the commented controller and router code is not reachable.

## 2. Implementation References

### Router and application mounting

- `backend/src/app.ts`: creates the `/api` base path and mounts this router at `/organizationManagement`.
- `backend/src/modules/organization_administration/organizationAdministrationRouter.ts`: registers all 18 reachable routes and route permissions.

### Controller, service, repository, and validation

- `backend/src/modules/organization_administration/organizationAdministratorController.ts`: reads authenticated context, validates request bodies, calls services, and builds response wrappers.
- `backend/src/modules/organization_administration/organizationAdministrationService.ts`: applies membership, role, duplicate, and system-role checks; sends invitations.
- `backend/src/modules/organization_administration/organizationAdministrationRepository.ts`: performs Prisma reads and writes scoped by tenant/company where implemented.
- `backend/src/modules/organization_administration/organizationAdministrationValidator.ts`: defines member, role, permission, and settings schemas.

### Authentication and authorization

- `backend/src/shared/middleware/authenticate.ts`: validates the Bearer JWT and backing session and sets `c.var.user`.
- `backend/src/shared/Authorization/authorize.ts`: resolves the user's tenant-level role and checks the route permission; `ORGANIZATION_ADMIN` bypasses individual permission membership.
- `backend/src/shared/Authorization/seeds/systemPermissions.ts`: defines the organization, member, role, and role-permission permissions.

### Relevant data and shared errors

- `backend/prisma/schema.prisma`: `Company`, `CompanyMembership`, `CompanyInvitation`, `Role`, `Permission`, `RolePermission`, `UserRole`, `User`, and `Tenant` models.
- `backend/src/shared/middleware/errorHandler.ts`: converts Zod errors to `422 INVALID DATA`, serializes `AppError` instances, and returns generic `500` errors for unhandled exceptions.
- `backend/src/shared/errors/appError.ts`: defines the status/code mappings used by the controllers and services.

## 3. Authentication and Authorization

Every route requires:

```http
Authorization: Bearer <access-token>
```

The HS256 token must contain non-empty `user_id`, `session_id`, and `tenant_id`; `company_id` is optional to the authentication middleware but all organization controllers require it and return `404` with `User does not belong to a company` when absent. The session must match the user and tenant, be unrevoked and unexpired, and belong to an active user.

Permission failures return a direct response rather than the shared error wrapper:

```json
{ "message": "Forbidden" }
```

The route permissions are:

| Area                  | Permissions                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Organization settings | `organization:read`, `organization:update`                                                                           |
| Members               | `organization_member:invite`, `organization_member:read`, `organization_member:update`, `organization_member:remove` |
| Roles                 | `organization_role:create`, `organization_role:read`, `organization_role:update`, `organization_role:delete`         |
| Role permissions      | `organization_role_permission:add`, `organization_role_permission:remove`                                            |

The service generally scopes records by the authenticated `tenant_id` and `company_id`. Route authorization is permission-based; the service does not perform an additional administrator check for most operations.

## 4. Endpoint Inventory

| Method | Effective Path                                                        | Purpose                         | Authentication                   | Authorization                         |
| ------ | --------------------------------------------------------------------- | ------------------------------- | -------------------------------- | ------------------------------------- |
| POST   | `/api/organizationManagement/members`                                 | Create a company invitation     | Bearer token and company context | `organization_member:invite`          |
| GET    | `/api/organizationManagement/members`                                 | List company memberships        | Bearer token and company context | `organization_member:read`            |
| GET    | `/api/organizationManagement/members/:userId`                         | Retrieve one company member     | Bearer token and company context | `organization_member:read`            |
| PATCH  | `/api/organizationManagement/members/:userId`                         | Update membership fields        | Bearer token and company context | `organization_member:update`          |
| DELETE | `/api/organizationManagement/members/:userId`                         | Remove company membership       | Bearer token and company context | `organization_member:remove`          |
| GET    | `/api/organizationManagement/members/validate/:token`
 | Validate a pending invitation  | Public                         | None                                  |
| POST   | `/api/organizationManagement/members/accept`
 | Accept an invitation           | Bearer token and tenant context | `organization_member:read`           |
| POST   | `/api/organizationManagement/roles`                                   | Create a company role           | Bearer token and company context | `organization_role:create`            |
| POST   | `/api/organizationManagement/members/:userId/roles`                   | Assign a role to a member       | Bearer token and company context | `organization_member:update`          |
| POST   | `/api/organizationManagement/roles/:roleId/permissions`               | Add permissions to a role       | Bearer token and company context | `organization_role_permission:add`    |
| GET    | `/api/organizationManagement/roles`                                   | List company roles              | Bearer token and company context | `organization_role:read`              |
| GET    | `/api/organizationManagement/roles/:roleId`                           | Retrieve one company role       | Bearer token and company context | `organization_role:read`              |
| GET    | `/api/organizationManagement/roles/:roleId/permissions`               | List role permissions           | Bearer token and company context | `organization_role:read`              |
| GET    | `/api/organizationManagement/permissions`                             | List all permissions            | Bearer token and company context | `organization_role:read`              |
| PATCH  | `/api/organizationManagement/roles/:roleId`                           | Update a role                   | Bearer token and company context | `organization_role:update`            |
| DELETE | `/api/organizationManagement/roles/:roleId`                           | Delete a role                   | Bearer token and company context | `organization_role:delete`            |
| DELETE | `/api/organizationManagement/roles/:roleId/permissions/:permissionId` | Remove a permission from a role | Bearer token and company context | `organization_role_permission:remove` |
| DELETE | `/api/organizationManagement/members/:userId/roles/:roleId`           | Remove a role assignment        | Bearer token and company context | `organization_member:update`          |
| GET    | `/api/organizationManagement/settings`                                | Retrieve company settings       | Bearer token and company context | `organization:read`                   |
| PATCH  | `/api/organizationManagement/settings`                                | Update company settings         | Bearer token and company context | `organization:update`                 |

## 5. Detailed Endpoint Contracts

Unless an endpoint says otherwise, the required header is `Authorization: Bearer <access-token>`, success status is `200`, and authentication/authorization behavior is as described in section 3.

### POST `/api/organizationManagement/members`

**Purpose:** Creates a company invitation for an email recipient. The recipient
may already have a LINAW account or may register through the invitation link.

**Implementation:** Router -> `addMember` -> `OrganizationAdministrationService.addMember` -> `createInvitation`; `EmailService` sends the invitation.

**Request Body:**

```json
{ "email": "member@example.com" }
```

`email` is required, normalized to lowercase, and must be a valid email. The
controller adds authenticated user, tenant, and company IDs; clients must not
send them.

**Success Response:** `200`:

```json
{ "success": true, "message": "invitation sent", "member": { "success": true } }
```

**Errors:** `404` if no company context; `409` if already a member or a pending
invitation already exists; `422` for invalid email; `503` if delivery fails;
`401`, `403`, or `500` from shared middleware/error handling.

**Business Rules and Side Effects:** The invitation is bound to the authenticated
tenant and company. A random 32-byte token is generated, only its SHA-256 hash is
persisted in `CompanyInvitation`, and the raw token is placed in the email URL.
Invitations expire after 72 hours and transition through `SENDING` to `PENDING`.
Delivery failure marks the invitation `REVOKED` and returns `503`. The token is
never returned by the API.

### GET `/api/organizationManagement/members/validate/:token`

**Purpose:** Publicly verifies that an organization invitation is pending and
unexpired. The response contains only the expiry timestamp; it does not expose
the email, tenant, company, or token.

**Errors:** `401` for malformed, expired, revoked, or consumed invitations.

### POST `/api/organizationManagement/members/accept`

**Purpose:** Accepts an invitation for the authenticated recipient.

**Request Body:**

```json
{ "token": "64-character-token" }
```

The recipient's user ID, tenant ID, and email are taken from the authenticated
session and server-side user record. The client cannot select a tenant or
company. The invitation email must match the authenticated user's email and the
invitation tenant must match the authenticated user's tenant.

Acceptance atomically claims the pending invitation and upserts one active
`CompanyMembership` for the invitation's company. It does not grant a role or
organization-administrator privileges. A claimed invitation cannot be replayed.

**Errors:** `401` for missing/invalid authentication or token; `403` for missing
member permission; `401` for expired, revoked, consumed, cross-tenant, or
email-mismatched invitations.

### Invitation registration handoff

The existing `/api/auth/signup` request accepts an optional `invitation_token`.
When present, the server validates the hashed token and invited email, creates
the new user in the invitation's existing tenant, creates the intended company
membership, and consumes the invitation in one transaction. Without a token,
signup retains its existing behavior of creating a new tenant. A globally
existing email remains ineligible for a second user account and must use the
authenticated acceptance flow instead.

### GET `/api/organizationManagement/members`

**Purpose:** Lists all memberships for the authenticated tenant/company.

**Implementation:** Router -> `getMember` -> `getMember` -> `findMembersByCompanyId`.

**Success Response:** `200`; the list is returned under `memberList`:

```json
{
  "success": true,
  "message": "successfully retrieved list",
  "memberList": [
    {
      "id": "membership-uuid",
      "tenant_id": "tenant-uuid",
      "company_id": "company-uuid",
      "user_id": "user-uuid",
      "job_title": null,
      "role_id": null,
      "employment_status": "ACTIVE",
      "department": null,
      "user": {},
      "role": null
    }
  ]
}
```

The repository includes the complete Prisma `user` and nullable `role` relations. Exact nested fields follow the schema/runtime serialization. No pagination or query filters exist.

**Errors:** `404` without company context; `401`, `403`, or `500` as shared. The query is tenant/company scoped.

### GET `/api/organizationManagement/members/:userId`

**Purpose:** Retrieves one membership for `userId`.

**Path Parameters:** `userId` is a required non-empty route string. It is not UUID-validated by the controller.

**Implementation:** `getUser` -> `getUser` -> `findCompanyMemberByUserId`.

**Success Response:** `200` with `{ "success": true, "message": "User retrieved", "user": <membership including user and role> }`.

**Errors:** `400` if the parameter is absent; `404` if no company context or the user is not a member; `401`, `403`, or `500` as shared.

**Business Rules:** Lookup requires matching tenant, company, and user IDs.

### PATCH `/api/organizationManagement/members/:userId`

**Purpose:** Updates membership role, employment status, and/or job title.

**Request Body:**

```json
{
  "role_id": "role-uuid",
  "employment_status": "ACTIVE",
  "jobTitle": "Finance Manager"
}
```

All fields are optional, but at least one must be present. `role_id` must be a UUID; `employment_status` must be `ACTIVE`, `INACTIVE`, or `SUSPENDED`; `jobTitle` is a trimmed 1-100 character string. `jobTitle` is camelCase while the persisted field is `job_title`.

**Success Response:** `200` with `{ "success": true, "message": " Successfully updated user ", "updated": <updated CompanyMembership> }`.

**Errors:** `400` for missing user ID; `404` for missing company context or non-member; `422` for body validation; `401`, `403`, or `500` as shared.

**Business Rules:** The update is scoped by the composite membership key `(tenant_id, company_id, user_id)`. It does not update the related user record.

### DELETE `/api/organizationManagement/members/:userId`

**Purpose:** Removes a user’s membership from the company.

**Path Parameters:** Required non-empty `userId`; no UUID validation.

**Success Response:** `200` with `{ "success": true, "message": "Successfully remove user", "removed": { "count": 1 } }` (Prisma `deleteMany` result; count may be `0` if concurrent data changes).

**Errors:** `400` if the parameter is absent; `404` for missing company context or non-member; `401`, `403`, or `500` as shared.

**Business Rules and Side Effects:** Only the membership row is deleted; the global user is not deleted. The delete is tenant/company/user scoped.

### POST `/api/organizationManagement/roles`

**Purpose:** Creates a tenant/company-owned role.

**Request Body:**

```json
{ "name": "Finance Manager", "description": "Approves finance requests" }
```

Both fields are required. `name` is trimmed and 1-100 characters; `description` is trimmed and at most 500 characters and is not nullable in the input schema.

**Success Response:** `201` with `{ "success": true, "message": "Successfully created role", "createdRole": <created Role> }`.

The repository derives `code` from the lowercased name, replacing non-alphanumeric runs with underscores, then persists tenant/company IDs and Prisma defaults.

**Errors:** `404` without company context; `422` for invalid body; `401`, `403`, or `500` as shared. Duplicate derived codes may produce an unhandled `500` because the service does not catch the Prisma unique constraint.

### POST `/api/organizationManagement/members/:userId/roles`

**Purpose:** Assigns an existing company role to an existing company member.

**Path Parameters:** Required non-empty `userId`; no UUID validation.

**Request Body:** `{ "role_id": "role-uuid" }`; `role_id` is required and must be a UUID.

**Success Response:** `200` with `{ "success": true, "message": "Successfully assigned role to member", "assigned": <created UserRole> }`.

**Errors:** `400` for missing path parameter; `404` for missing company context, member, or company/tenant-scoped role; `422` for invalid role ID; `409`/`500` may result from the `UserRole` uniqueness constraint because no conflict mapping is implemented.

**Business Rules:** The created `UserRole` is scoped to the authenticated tenant/company and target member. The member’s `CompanyMembership.role_id` is not changed.

### POST `/api/organizationManagement/roles/:roleId/permissions`

**Purpose:** Adds one or more permissions to a role.

**Path Parameters:** Required non-empty `roleId`; no UUID validation by controller.

**Request Body:** `{ "permissionIds": ["permission-uuid"] }`; array must contain at least one UUID.

**Success Response:** `200` with `{ "success": true, "message": "Successfully assigned permissions to role", "updated": { "count": 1 } }` from Prisma `createMany`.

**Errors:** `400` for missing role ID; `404` for missing company context or company/tenant-scoped role; `422` for invalid body; `500` for database errors such as nonexistent permission foreign keys.

**Business Rules:** Duplicate `(role_id, permission_id)` rows are skipped. The service verifies the role scope but does not pre-verify each permission ID.

### GET `/api/organizationManagement/roles`

**Purpose:** Lists roles belonging to the authenticated tenant/company.

**Success Response:** `200` with `{ "success": true, "message": "Successfully retrieved roles", "roles": [<Role>] }`.

**Errors:** `404` without company context; `401`, `403`, or `500` as shared. No pagination or filters are implemented.

### GET `/api/organizationManagement/roles/:roleId`

**Purpose:** Retrieves one tenant/company-scoped role.

**Path Parameters:** Required non-empty `roleId`; no UUID validation.

**Success Response:** `200` with `{ "success": true, "message": "Successfully retrieved role", "role": <Role or null> }`. Unlike most service methods, `getRole` does not throw when the repository returns null.

**Errors:** `400` for missing role ID; `404` only for missing company context; `401`, `403`, or `500` as shared.

**Business Rules:** Repository lookup is scoped by role ID, tenant ID, and company ID.

### GET `/api/organizationManagement/roles/:roleId/permissions`

**Purpose:** Lists permissions assigned to a role.

**Path Parameters:** Required non-empty `roleId`; no UUID validation.

**Success Response:** `200` with `{ "success": true, "message": "Successfully retrieved role permissions", "permissions": [<RolePermission including permission>] }`.

**Errors:** `400` for missing role ID; `404` for missing company context; `401`, `403`, or `500` as shared. A nonexistent role returns an empty list rather than a not-found error.

**Business Rules:** The nested role filter enforces tenant/company scope.

### GET `/api/organizationManagement/permissions`

**Purpose:** Lists the permission catalog.

**Implementation:** `getPermissions` -> `getPermissions` -> `findPermissions`.

**Success Response:** `200` with `{ "success": true, "message": "Successfully retrieved permissions", "permissions": [<Permission>] }`.

**Authorization:** `organization_role:read`; the controller does not require company context for this endpoint, although authentication and permission middleware still apply.

**Business Rules:** The repository performs an unfiltered global `Permission.findMany`; the result is not tenant/company scoped.

### PATCH `/api/organizationManagement/roles/:roleId`

**Purpose:** Updates a role’s name and/or description.

**Path Parameters:** Required non-empty `roleId`; no UUID validation.

**Request Body:** `{ "name": "Updated Name", "description": null }`. At least one field is required. `name` is optional, trimmed, 1-100 characters. `description` is optional, nullable, and at most 500 trimmed characters.

**Success Response:** `200` with `{ "success": true, "message": "Successfully updated role", "updated": <updated Role> }`.

**Errors:** `400` for missing role ID; `404` for missing company context or role not found; `422` for body validation; `401`, `403`, or `500` as shared.

**Business Rules:** The service verifies tenant/company scope, but the repository update uses only `id` in its `where` clause after verification. Name changes do not regenerate the stored role `code`.

### DELETE `/api/organizationManagement/roles/:roleId`

**Purpose:** Deletes a company role.

**Path Parameters:** Required non-empty `roleId`; no UUID validation.

**Success Response:** `200` with `{ "success": true, "message": "Successfully deleted role", "deleted": <deleted Role> }`.

**Errors:** `400` for missing role ID; `404` for missing company context or role not found; `500` with generic handling for system-role rejection (`System roles cannot be deleted`) and database foreign-key/constraint errors. The system-role rejection is a plain `Error`, not an `AppError`.

**Business Rules and Side Effects:** The service prevents deleting `is_system` roles. Non-system role deletion may fail if related memberships, user roles, workflow levels, or permissions violate database relations; no explicit cascade behavior is defined in the inspected Prisma model.

### DELETE `/api/organizationManagement/roles/:roleId/permissions/:permissionId`

**Purpose:** Removes a permission assignment from a role.

**Path Parameters:** Both `roleId` and `permissionId` are required non-empty strings; neither is UUID-validated by the controller.

**Success Response:** `200` with `{ "success": true, "message": "Successfully removed permission from role", "removed": { "count": 1 } }` from `deleteMany`.

**Errors:** `400` for missing IDs; `404` for missing company context or role not found; `500` with generic handling for system-role rejection (`Permissions cannot be removed from system roles`) or database errors.

**Business Rules:** The service checks the role in tenant/company scope and prevents changes to system roles. The delete repository query uses only role and permission IDs after that check; count may be `0` if the assignment is absent.

### DELETE `/api/organizationManagement/members/:userId/roles/:roleId`

**Purpose:** Removes a user-role assignment.

**Path Parameters:** Required non-empty `userId` and `roleId`; no UUID validation.

**Success Response:** `200` with `{ "success": true, "message": "Successfully removed role from member", "removed": { "count": 1 } }`.

**Errors:** `400` for missing IDs; `404` for missing company context or member not found; `401`, `403`, or `500` as shared.

**Business Rules:** The delete is scoped by tenant, company, user, and role. It removes `UserRole`, not the membership’s nullable `role_id`.

### GET `/api/organizationManagement/settings`

**Purpose:** Retrieves the company settings record.

**Success Response:** `200` with `{ "success": true, "message": "Successfully retrieved settings", "settings": <Company> }`. The repository returns the complete `Company` Prisma row, including tenant/company identifiers, legal/display names, contact fields, address, and timestamps.

**Errors:** `404` without company context; a missing company returns `settings: null` rather than a service not-found error; `401`, `403`, or `500` as shared.

**Business Rules:** Lookup uses the authenticated `company_id`. The repository does not additionally constrain by tenant ID.

### PATCH `/api/organizationManagement/settings`

**Purpose:** Updates company contact and naming settings.

**Request Body:**

```json
{
  "companyEmail": "contact@example.com",
  "displayName": "LINAW Procurement",
  "legalName": "LINAW Procurement Ltd",
  "contactNumber": "+1 555 0100",
  "address": "1 Example Street"
}
```

All fields are optional, but at least one must be present. `companyEmail` must be an email; `displayName` is 1-150 characters; `legalName` is 1-200; `contactNumber` is 1-30; and `address` is 1-500. Strings are trimmed. Input names are transformed by the service/repository to `contact_email`, `display_name`, `legal_name`, `contact_phone`, and `address`.

**Success Response:** `200` with `{ "success": true, "message": "Successfully updated settings", "updated": <updated Company> }`.

**Errors:** `404` for missing company context or missing company settings; `422` for invalid/empty body; `401`, `403`, or `500` as shared.

**Business Rules:** The service first checks that the company exists, then updates by company ID. The repository update does not include tenant ID in its `where` clause after that check.

## 6. Shared Data Structures and Enums

### Company membership

`CompanyMembership` includes `id`, `tenant_id`, `company_id`, `user_id`, nullable `job_title`, nullable `role_id`, nullable `employment_status`, nullable `department`, timestamps, and related `user`/`role` objects where the repository uses `include`.

### Role and permissions

`Role` includes `id`, nullable `tenant_id`, nullable `company_id`, `code`, `name`, nullable `description`, `is_system`, and timestamps. `Permission` includes `id`, globally unique `code`, `name`, `resource`, `action`, nullable `description`, and `created_at`. `RolePermission` includes IDs, timestamp, and nested permission on role-permission reads.

Membership status values accepted by validation are `ACTIVE`, `INACTIVE`, and `SUSPENDED`.

### Common error wrapper

Handled application errors use:

```json
{ "success": false, "error": { "code": "...", "message": "..." } }
```

Zod failures are `422` with code `INVALID DATA`; `RequestDataError` is `400`; `NotFoundError` is `404`; authorization middleware uses an unwrapped `403`; and unhandled errors are generic `500` responses.

## 7. Cross-Endpoint Business Rules

- Tenant and company IDs come from authenticated context and are passed into service/repository queries; clients cannot select another scope through request bodies.
- Company membership is unique by `(tenant_id, company_id, user_id)`.
- Role codes are unique by `(tenant_id, code)`, while permission codes are globally unique.
- Role-permission pairs are unique by `(role_id, permission_id)` and bulk assignment skips duplicates.
- User-role assignments are unique by `(tenant_id, user_id, role_id, company_id)`.
- System roles cannot be deleted or have permissions removed. This rule is service-enforced, but the resulting plain errors become generic `500` responses.
- Removing a membership removes only the membership row. Removing a user-role assignment does not update the membership role field.
- There is no pagination, sorting, or filtering in any organization-administration endpoint.
- The intended administrative audit endpoint is commented out and is not reachable.

## 8. Frontend Integration Notes

- Use `/api/organizationManagement`, not the legacy `/api/org-admin` paths in `docs/architecture/APIs/Organization_Administration.md`.
- Send a valid Bearer token with a company context. Missing company context currently returns `404`.
- Use the exact request field casing: member updates use `jobTitle`, settings use camelCase names, and role-permission assignment uses `permissionIds`.
- Invitation success is returned under `member`, member lists under `memberList`, role operations under `role`/`roles`/`createdRole`, and settings under `settings`/`updated`; there is no consistent `data` wrapper.
- Handle permission failures as `{ "message": "Forbidden" }` and validation/service failures as the shared `{ success: false, error }` structure.
- The permission catalog is global and may include permissions unrelated to the current company; role-permission assignment still requires a company-scoped role.
- Creating an invitation sends an email after persisting the invitation. The frontend should not assume email delivery failure rolls back the stored invitation.

## 9. Contract Gaps and Implementation Discrepancies

1. **The requested documentation location is inconsistent with the target.** The target is `organization_administration`, but the prompt names the Approval Workflow directory. This contract is stored in the actual target module directory.
2. **The legacy API document is stale.** It uses `/api/org-admin`, different payloads, response wrappers, and endpoints not present in the live router. The live prefix is `/api/organizationManagement`.
3. **Response wrappers are inconsistent.** Some operations return `data`, but organization operations use top-level keys such as `member`, `memberList`, `user`, `roles`, `permissions`, `settings`, `updated`, and `removed`.
4. **Several path IDs are not UUID-validated.** Only body schemas validate UUIDs for selected fields; missing IDs are checked, but malformed non-empty IDs reach Prisma and may become generic `500` errors.
5. **System-role errors are not typed application errors.** `deleteRole` and permission removal throw plain `Error`, so the shared handler reports generic `500` instead of a specific conflict/forbidden response.
6. **Role update/delete and permission removal narrow repository writes by ID only.** Services first verify tenant/company scope, but the subsequent write/delete query does not repeat that scope. This is an implementation risk if the data changes between checks.
7. **`getRole` does not report missing roles.** A role outside the scope or absent is returned as `role: null` with `200`, unlike member and settings operations that explicitly throw not-found errors.
8. **Permission listing is global.** `findPermissions()` has no tenant/company filter, although it is exposed through a company administration route.
9. **The service does not validate each permission before bulk assignment.** Invalid permission IDs may produce database errors; duplicates are silently skipped.
10. **The invitation is persisted before email delivery.** Email/provider failure can leave a stored invitation while the request returns an error.
11. **The repository uses both membership roles and user roles.** Updating `CompanyMembership.role_id`, assigning `UserRole`, and removing `UserRole` affect different records; the API does not normalize these concepts.

## 10. Verification Summary

- **Verified endpoints:** 18 live router registrations.
- **Routes accounted for:** all member, role, permission, assignment, and settings registrations in `organizationAdministrationRouter.ts`, combined with `/api` and `/organizationManagement` mounts in `app.ts`.
- **Layers inspected:** application bootstrap, router, controller, service, repository, validators, authentication, authorization, shared errors, permission seeds, Prisma schema, and legacy API documentation.
- **Runtime testing:** not performed. This contract is based on static source inspection; no data-changing requests were issued.
- **Unresolved questions:** exact JSON serialization of full Prisma records, deployed trailing-slash behavior, and database behavior for foreign-key/unique conflicts require runtime verification.
- **Files changed:** only `backend/src/modules/organization_administration/api_contract.md` for this task. No application source, frontend, Prisma schema, or migration files were modified.
