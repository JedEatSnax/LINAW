# RBAC Authorization Guide

## Overview

Role-Based Access Control (RBAC) is an authorization mechanism that determines whether an authenticated user is allowed to perform a specific operation based on their assigned role.

The basic flow is:

```text
Request
   ↓
Rate Limiter
   ↓
Authentication
   ↓
Authorization / RBAC
   ↓
Controller
   ↓
Service
   ↓
Repository / Database
```

Each layer has a separate responsibility:

- **Rate Limiter** — Controls how frequently an endpoint can be accessed.
- **Authentication** — Determines who the requester is.
- **Authorization / RBAC** — Determines whether the authenticated requester is allowed to perform the requested operation.
- **Controller** — Handles the HTTP request and response.
- **Service** — Performs business logic and resource-level authorization.
- **Repository** — Handles data access and should maintain tenant/resource boundaries where appropriate.

RBAC should not replace authentication or resource-level authorization. It is one layer in the application's overall security model.

---

# 1. Authentication vs Authorization

Authentication and authorization solve different problems.

### Authentication

Authentication answers:

> Who is this user?

For example:

```text
User ID: 123
Tenant ID: organization-a
```

The authentication middleware establishes the identity of the requester.

```ts
authenticate;
```

After successful authentication, the request may contain information such as:

```ts
req.user.id;
req.user.tenantId;
```

### Authorization

Authorization answers:

> Is this authenticated user allowed to perform this operation?

For example:

```text
User:
    role = approver

Requested operation:
    audit_trail:verify

Role permissions:
    approver
        ├── purchase_order:read
        ├── purchase_order:approve
        └── audit_trail:verify

Result:
    ALLOWED
```

Authentication must happen before authorization because authorization requires an authenticated identity.

---

# 2. Basic RBAC Model

The basic RBAC relationship is:

```text
User
  ↓
Role
  ↓
Permissions
```

For example:

```text
User
└── Role: approver
      ├── purchase_order:read
      ├── purchase_order:approve
      └── audit_trail:verify
```

A permission represents an atomic capability.

Examples:

```text
user:read
user:create

purchase_order:create
purchase_order:read
purchase_order:update
purchase_order:approve

audit_trail:search
audit_trail:verify
```

A role is a collection of permissions.

```text
approver
├── purchase_order:read
├── purchase_order:approve
├── audit_trail:search
└── audit_trail:verify
```

The authorization middleware checks whether the user's current role contains the permission required by the endpoint.

---

# 3. Multi-Tenant RBAC

In a multi-tenant system, roles should generally be associated with a user's membership in an organization or tenant rather than treating the role as a permanent global property of the user.

For example:

```text
User
├── Organization A
│   └── Role: admin
│
├── Organization B
│   └── Role: approver
│
└── Organization C
    └── Role: procurement_officer
```

A simplified database structure could look like:

```text
users
├── id
└── ...

organizations
├── id
└── ...

organization_members
├── user_id
├── organization_id
├── role
└── ...
```

This allows the same user to have different roles in different organizations.

For example:

```text
User 123
    ↓
Organization A
    ↓
admin

User 123
    ↓
Organization B
    ↓
supplier
```

Therefore, authorization must consider both:

```text
User
+
Current organization/tenant
+
Membership role
+
Required permission
```

---

# 4. Do Not Put Authorization Decisions in the JWT

A JWT should preferably establish the user's identity rather than permanently storing their authorization state.

Avoid relying on:

```ts
{
  userId: "123",
  role: "approver"
}
```

as the authoritative source of the user's current role.

The user's role may change while the JWT is still valid.

For example:

```text
10:00
User role = procurement_officer

10:05
Administrator changes role
        ↓
User role = approver

10:10
Old JWT still exists
```

If the JWT contains the old role, the authorization system may continue using stale authorization information.

Instead, the JWT can establish the user's identity:

```text
JWT
└── userId
```

Authorization can then determine the user's current organization membership and role from trusted server-side state.

Conceptually:

```text
JWT
 ↓
User ID
 ↓
Current organization
 ↓
Organization membership
 ↓
Current role
 ↓
Role permissions
 ↓
Authorization decision
```

---

# 5. Define Permissions

Permissions should represent specific capabilities.

A common naming convention is:

```text
resource:action
```

Examples:

```text
user:read
user:create
user:update
user:delete

purchase_order:read
purchase_order:create
purchase_order:update
purchase_order:approve

audit_trail:search
audit_trail:verify
```

Avoid overly broad permissions when a more precise capability is useful.

For example, prefer:

```text
purchase_order:approve
```

over:

```text
purchase_order:manage
```

when approval is a distinct security-sensitive operation.

However, do not create unnecessary permissions for every tiny internal operation.

The permission model should represent meaningful authorization boundaries.

---

# 6. Permission Definition

A permission registry can be centralized inside the shared authorization system.

Example:

```ts
export const permissions = {
  user: {
    read: "user:read",
    create: "user:create",
    update: "user:update",
    delete: "user:delete",
  },

  purchaseOrder: {
    read: "purchase_order:read",
    create: "purchase_order:create",
    update: "purchase_order:update",
    approve: "purchase_order:approve",
  },

  auditTrail: {
    search: "audit_trail:search",
    verify: "audit_trail:verify",
  },
} as const;
```

The important principle is that permission names should be:

- Explicit
- Stable
- Easy to understand
- Specific enough to represent an authorization boundary
- Independent from HTTP routes

The permission should describe the capability rather than the implementation.

For example:

```text
audit_trail:verify
```

is preferable to:

```text
GET:/api/audit-trails/:auditId/verify
```

because routes can change while the underlying capability remains the same.

---

# 7. Define the Permission Type

The application should have a type representing valid permissions.

One straightforward approach is an explicit union:

```ts
export type Permission =
  | "user:read"
  | "user:create"
  | "user:update"
  | "user:delete"
  | "purchase_order:read"
  | "purchase_order:create"
  | "purchase_order:update"
  | "purchase_order:approve"
  | "audit_trail:search"
  | "audit_trail:verify";
```

This makes invalid permissions a compile-time error.

For example:

```ts
authorize("audit_trail:verify");
```

is valid.

While:

```ts
authorize("audit_trail:banana");
```

should fail type checking.

The exact type-generation strategy can be changed later if the permission registry becomes large.

---

# 8. Define Roles

Roles represent collections of permissions.

Example:

```ts
export type Role = "admin" | "procurement_officer" | "approver" | "supplier";
```

Roles should represent meaningful organizational responsibilities.

Example:

```text
admin
    ↓
Broad administrative permissions

procurement_officer
    ↓
Procurement-related operational permissions

approver
    ↓
Approval-related permissions

supplier
    ↓
Supplier-related permissions
```

---

# 9. Map Roles to Permissions

Create a centralized role-to-permission mapping.

Example:

```ts
export const rolePermissions: Record<Role, readonly Permission[]> = {
  admin: [
    "user:read",
    "user:create",
    "user:update",
    "user:delete",

    "purchase_order:read",
    "purchase_order:create",
    "purchase_order:update",
    "purchase_order:approve",

    "audit_trail:search",
    "audit_trail:verify",
  ],

  procurement_officer: [
    "purchase_order:read",
    "purchase_order:create",
    "purchase_order:update",

    "audit_trail:search",
  ],

  approver: [
    "purchase_order:read",
    "purchase_order:approve",

    "audit_trail:search",
    "audit_trail:verify",
  ],

  supplier: ["purchase_order:read"],
};
```

This creates a clear policy:

```text
Role
  ↓
Permissions
```

For example:

```text
approver
├── purchase_order:read
├── purchase_order:approve
├── audit_trail:search
└── audit_trail:verify
```

---

# 10. Implement Permission Checking

The core RBAC operation should be simple.

```ts
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
```

Example:

```ts
hasPermission("approver", "audit_trail:verify");
```

Result:

```text
true
```

While:

```ts
hasPermission("supplier", "audit_trail:verify");
```

Result:

```text
false
```

This function should remain independent from Express.

It should not know about:

```ts
Request;
Response;
NextFunction;
```

That keeps the actual RBAC policy reusable.

---

# 11. Authorization Middleware

The Express authorization middleware can then use the RBAC policy.

Conceptually:

```ts
export function authorize(permission: Permission) {
  return async (req, res, next) => {
    // Obtain authenticated user
    // Determine current organization
    // Determine user's role in that organization
    // Check permission
    // Reject or continue
  };
}
```

The middleware should assume authentication has already established the user's identity.

Example:

```ts
router.get(
  "/:auditId/verify",
  authenticate,
  authorize("audit_trail:verify"),
  verifyAuditTrail,
);
```

The order matters:

```text
authenticate
    ↓
authorize
    ↓
controller
```

Do not run authorization before authentication because authorization needs an authenticated identity.

---

# 12. Authorization Decision

The middleware should conceptually perform the following checks:

```text
1. Is the user authenticated?
       ↓
2. Does the user belong to the current organization?
       ↓
3. What role does the user have in that organization?
       ↓
4. Does that role have the required permission?
       ↓
5. Allow or reject the request
```

A simplified implementation could look like:

```ts
export function authorize(permission: Permission) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const user = req.user;

    const role = await getUserRole(user.id, user.tenantId);

    if (!role) {
      res.status(403).json({
        message: "Forbidden",
      });

      return;
    }

    if (!hasPermission(role, permission)) {
      res.status(403).json({
        message: "Forbidden",
      });

      return;
    }

    next();
  };
}
```

The actual implementation may differ depending on how organization membership is modeled.

---

# 13. HTTP Status Codes

Authorization failures should generally use:

```text
403 Forbidden
```

when the user is authenticated but does not have permission.

The distinction is:

```text
401 Unauthorized
```

Usually means:

```text
The requester is not authenticated.
```

While:

```text
403 Forbidden
```

means:

```text
The requester is authenticated but is not allowed to perform the operation.
```

Therefore:

```text
No valid authentication
    → 401

Authenticated but insufficient permission
    → 403
```

---

# 14. Integrating Authentication, Rate Limiting, and RBAC

A protected endpoint can combine all three mechanisms.

Example:

```ts
router.post(
  "/",
  criticalRateLimit,
  authenticate,
  authorize("purchase_order:create"),
  createPurchaseOrder,
);
```

The complete flow becomes:

```text
Request
   ↓
Rate Limiter
   ↓
Authentication
   ↓
RBAC Authorization
   ↓
Controller
   ↓
Service
   ↓
Repository
```

Each component has a different purpose.

### Rate Limiter

```text
"How frequently can this requester call this endpoint?"
```

### Authentication

```text
"Who is this requester?"
```

### RBAC

```text
"Is this requester allowed to perform this operation?"
```

### Service

```text
"Is this operation valid for this specific resource?"
```

---

# 15. Example: Audit Trail

Suppose an audit trail module exposes:

```text
GET /api/audit-trails/search
GET /api/audit-trails/:auditId/verify
```

Define:

```ts
export type Permission = "audit_trail:search" | "audit_trail:verify";
```

Assign permissions to appropriate roles:

```ts
export const rolePermissions: Record<Role, readonly Permission[]> = {
  admin: ["audit_trail:search", "audit_trail:verify"],

  approver: ["audit_trail:search", "audit_trail:verify"],

  procurement_officer: ["audit_trail:search"],

  supplier: [],
};
```

Then:

```ts
router.get(
  "/search",
  auditTrailRateLimit,
  authenticate,
  authorize("audit_trail:search"),
  searchAuditTrail,
);
```

And:

```ts
router.get(
  "/:auditId/verify",
  auditTrailRateLimit,
  authenticate,
  authorize("audit_trail:verify"),
  verifyAuditTrail,
);
```

A supplier requesting verification would therefore fail RBAC:

```text
supplier
    ↓
audit_trail:verify
    ↓
not allowed
    ↓
403 Forbidden
```

An approver would pass:

```text
approver
    ↓
audit_trail:verify
    ↓
allowed
    ↓
service
```

---

# 16. Resource-Level Authorization

RBAC answers:

> Is this user allowed to perform this type of operation?

It does not necessarily answer:

> Is this user allowed to perform this operation on this specific resource?

These are different checks.

For example:

```text
User:
tenant A
role: approver

Permission:
audit_trail:verify

Result:
RBAC = allowed
```

However, the requested audit trail could belong to tenant B.

Therefore the service should perform resource-level verification.

```text
RBAC
    ↓
User can verify audit trails
    ↓
Service
    ↓
Does audit trail belong to user's tenant?
    ↓
NO
    ↓
Reject
```

This creates defense in depth.

---

# 17. Service-Level Tenant Verification

A service should verify that the requested resource belongs to the user's tenant before performing the operation.

Conceptually:

```ts
async function verifyAuditTrail(
  userId: string,
  tenantId: string,
  auditId: string,
) {
  const auditTrail = await repository.findById(auditId);

  if (!auditTrail) {
    throw new NotFoundError();
  }

  if (auditTrail.tenantId !== tenantId) {
    throw new ForbiddenError();
  }

  // Continue with business verification.
}
```

The exact implementation depends on the application's domain model.

The important principle is:

```text
Permission check
    +
Resource ownership / tenant check
```

---

# 18. Prefer Tenant-Scoped Queries

When possible, tenant isolation should also be enforced at the data-access level.

Instead of:

```ts
repository.findById(resourceId);
```

prefer a tenant-scoped operation where appropriate:

```ts
repository.findById(resourceId, tenantId);
```

Conceptually:

```sql
SELECT *
FROM audit_trails
WHERE id = ?
  AND tenant_id = ?;
```

This provides another layer of protection.

The architecture becomes:

```text
RBAC
  ↓
Can perform operation?
  ↓
Service
  ↓
Does resource belong to tenant?
  ↓
Repository
  ↓
Is database query tenant-scoped?
```

This is defense in depth rather than relying on a single authorization check.

---

# 19. Authorization Should Not Contain Business Logic

Avoid putting business rules inside the RBAC middleware.

Bad:

```ts
authorize("purchase_order:approve");
```

also knowing:

```text
Is the purchase order pending?
Is the purchase order already approved?
Is the purchase order expired?
Does the amount exceed the approval limit?
```

Those are business rules.

The authorization layer should primarily answer:

```text
Is this actor authorized for this operation?
```

The service should handle:

```text
Is this operation valid?
Is this resource accessible?
Is the resource in the correct state?
```

This keeps responsibilities separated.

---

# 20. Example Complete Request Flow

A complete protected request might look like:

```text
HTTP Request
    │
    ▼
Rate Limiter
    │
    ├── Limit exceeded → 429
    │
    ▼
Authentication
    │
    ├── Invalid/missing authentication → 401
    │
    ▼
RBAC Authorization
    │
    ├── Invalid organization membership → 403
    ├── Missing permission → 403
    │
    ▼
Controller
    │
    ▼
Service
    │
    ├── Resource belongs to another tenant → reject
    ├── Business rule violation → reject
    │
    ▼
Repository
    │
    └── Tenant-scoped database access
    │
    ▼
Response
```

This gives each security layer a clear responsibility.

---

# 21. Module-by-Module RBAC Development

RBAC does not need to be designed completely before every module is implemented.

A practical approach is to define the permissions as each module is developed.

For example:

```text
Audit Trail
├── audit_trail:search
└── audit_trail:verify

Purchase Orders
├── purchase_order:create
├── purchase_order:read
├── purchase_order:update
└── purchase_order:approve

Users
├── user:read
├── user:create
└── user:update
```

When implementing a module:

```text
1. Define module operations
2. Identify protected operations
3. Define required permissions
4. Add permissions to RBAC registry
5. Assign permissions to appropriate roles
6. Add authorize() to endpoints
7. Add resource/tenant checks in the service
8. Add rate limiting where necessary
9. Test authorization behavior
```

This allows each module to become security-complete before moving on.

---

# 22. Recommended Endpoint Structure

A typical protected route should look like:

```ts
router.post(
  "/",
  rateLimiter,
  authenticate,
  authorize("resource:create"),
  controller,
);
```

For a read operation:

```ts
router.get("/:id", authenticate, authorize("resource:read"), controller);
```

For a sensitive operation:

```ts
router.post(
  "/:id/approve",
  criticalRateLimit,
  authenticate,
  authorize("resource:approve"),
  controller,
);
```

The middleware ordering should remain consistent throughout the application.

---

# 23. Suggested Shared Authorization Structure

A generic shared authorization package could look like:

```text
shared/
└── authorization/
    ├── permissions.ts
    ├── roles.ts
    ├── role-permissions.ts
    ├── has-permission.ts
    ├── authorize.ts
    └── index.ts
```

Example responsibilities:

```text
permissions.ts
    ↓
Permission definitions

roles.ts
    ↓
Role definitions

role-permissions.ts
    ↓
Role → Permission mapping

has-permission.ts
    ↓
Pure permission checking

authorize.ts
    ↓
Express authorization middleware

index.ts
    ↓
Public exports
```

The shared authorization layer should not import feature modules.

The dependency direction should remain:

```text
modules
   ↓
shared/authorization
```

not:

```text
shared/authorization
   ↓
modules
```

This preserves module isolation.

---

# 24. Keep the Core RBAC Logic Framework-Agnostic

The core permission check should not depend on Express.

Prefer:

```ts
hasPermission(role, permission);
```

over making the permission engine directly manipulate:

```ts
Request;
Response;
NextFunction;
```

Only the Express-specific middleware should know about HTTP.

This keeps the RBAC policy reusable for:

- HTTP requests
- Background jobs
- Event handlers
- Internal services
- CLI operations
- Future transports

---

# 25. Testing RBAC

RBAC should be tested independently from the HTTP layer.

At minimum, test:

```text
Role has permission
    → true

Role does not have permission
    → false
```

Example:

```ts
expect(hasPermission("approver", "audit_trail:verify")).toBe(true);

expect(hasPermission("supplier", "audit_trail:verify")).toBe(false);
```

Then test the middleware separately.

Important cases include:

```text
Unauthenticated request
    → 401

Authenticated user without organization membership
    → 403

Authenticated user with insufficient role
    → 403

Authenticated user with required permission
    → next()

Resource belongs to another tenant
    → reject

Valid role + permission + tenant
    → operation proceeds
```

---

# 26. Security Principles

The RBAC implementation should follow these principles.

## Least Privilege

Users should receive only the permissions necessary for their responsibilities.

Avoid giving every role:

```text
*
```

or an equivalent unrestricted permission.

---

## Explicit Permissions

Prefer explicit permissions:

```text
purchase_order:approve
```

over scattered role checks:

```ts
if (user.role === "admin" || user.role === "approver") {
  ...
}
```

The role-to-permission mapping should be the central policy.

---

## Deny by Default

If a role does not explicitly have a permission, it should not be allowed to perform that operation.

Conceptually:

```text
Permission exists in role
    → allow

Permission does not exist in role
    → deny
```

---

## Server-Side Enforcement

Authorization must always be enforced on the server.

Never rely on frontend UI restrictions such as:

```text
Hide approve button
```

as the security mechanism.

A user can bypass frontend restrictions and call the API directly.

The backend must independently enforce:

```text
authentication
authorization
tenant isolation
business rules
```

---

## Defense in Depth

Do not rely on one security layer.

Use:

```text
Rate limiting
+
Authentication
+
RBAC
+
Resource-level authorization
+
Tenant-scoped data access
+
Business validation
```

Each layer should provide a distinct security boundary.

---

# 27. Recommended Final Architecture

A mature implementation can follow this model:

```text
                        HTTP Request
                             │
                             ▼
                       Rate Limiter
                             │
                             ▼
                      Authentication
                             │
                             ▼
                  ┌─────────────────────┐
                  │     Authorization   │
                  │                     │
                  │ User                │
                  │   ↓                 │
                  │ Organization        │
                  │   ↓                 │
                  │ Membership          │
                  │   ↓                 │
                  │ Role                │
                  │   ↓                 │
                  │ Permissions         │
                  │   ↓                 │
                  │ Required permission │
                  └─────────────────────┘
                             │
                         Allowed
                             │
                             ▼
                         Controller
                             │
                             ▼
                          Service
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
          Resource/Tenant         Business Rules
             Verification
                  │                     │
                  └──────────┬──────────┘
                             ▼
                         Repository
                             │
                             ▼
                    Tenant-Scoped Data
                             │
                             ▼
                          Response
```

The resulting security model is:

```text
Rate Limiter
    ↓
Controls request frequency

Authentication
    ↓
Establishes identity

RBAC Authorization
    ↓
Establishes whether the actor is allowed to perform the operation

Service Authorization
    ↓
Establishes whether the actor can perform the operation on the requested resource

Repository / Database
    ↓
Maintains tenant/resource data boundaries

Business Logic
    ↓
Performs the actual operation
```

This separation keeps the authorization system centralized while allowing each module to define its own permissions and resource-specific security requirements.

# 28. Practical Implementation Checklist

For every new module:

- [ ] Identify protected operations.
- [ ] Define permissions for those operations.
- [ ] Add permissions to the authorization registry.
- [ ] Determine which roles receive each permission.
- [ ] Add `authorize(permission)` to protected endpoints.
- [ ] Ensure `authenticate` runs before `authorize`.
- [ ] Add rate limiting to sensitive/high-risk endpoints.
- [ ] Add resource-level tenant verification in the service.
- [ ] Ensure database queries are tenant-scoped where appropriate.
- [ ] Test allowed roles.
- [ ] Test denied roles.
- [ ] Test missing organization membership.
- [ ] Test cross-tenant resource access.
- [ ] Test unauthenticated requests.
- [ ] Test rate-limit behavior.
- [ ] Verify the module does not bypass authorization through another execution path.

The goal is not merely to have RBAC middleware.

The goal is for every module to have a complete security boundary:

```text
Module
├── Authentication
├── Authorization
├── Rate Limiting
├── Validation
├── Resource/Tenant Verification
├── Business Logic
└── Tests
```
