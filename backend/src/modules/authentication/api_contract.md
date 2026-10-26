# Authentication API Contract

## 1. Overview

The Authentication module handles account registration, password authentication, access/refresh token issuance, refresh-token rotation, logout, password-reset requests, password-reset completion, authenticated user lookup, and access-token validation.

The live API base path is `/api/auth`. The router exposes eight routes. Signup, login, forgot-password, and reset-password are public but rate-limited. User lookup and token validation require the shared access-token middleware. Logout and refresh use a `refreshToken` cookie and do not apply the access-token middleware in the router.

## 2. Implementation References

### Router and application mounting

- `backend/src/app.ts`: creates `/api` and mounts the router at `/auth`.
- `backend/src/modules/authentication/authRouter.ts`: registers all eight authentication routes and route-level middleware.

### Controller, service, repository, and validation

- `backend/src/modules/authentication/authController.ts`: parses bodies/path IDs, reads access-token context or refresh cookies, and constructs responses.
- `backend/src/modules/authentication/authServices.ts`: implements registration, login, access/refresh token generation, refresh rotation, logout, password reset, and user ownership checks.
- `backend/src/modules/authentication/authRepository.ts`: persists users/credentials/tenants/sessions/reset tokens and performs atomic session/reset-token operations.
- `backend/src/modules/authentication/authValidator.ts`: defines UUID, signup, login, forgot-password, reset-password, and unused logout schemas.
- `backend/src/modules/authentication/authPassword.ts`: password hashing and verification helper used for passwords, refresh-token hashes, and reset-token-secret hashes.
- `backend/src/modules/authentication/authJWT.ts`: access/refresh JWT generation and refresh payload verification.
- `backend/src/modules/authentication/authNotifications.ts`: Mailgun password-reset notification and no-op notifier.

### Shared authentication and errors

- `backend/src/shared/middleware/authenticate.ts`: verifies access JWTs and backing sessions for protected routes.
- `backend/src/shared/middleware/errorHandler.ts`: maps Zod errors to `422 INVALID DATA`, serializes `AppError`, and returns generic `500` for unhandled errors.
- `backend/src/shared/errors/appError.ts`: defines authentication, conflict, not-found, token, validation, and server error mappings.

### Relevant Prisma models

- `backend/prisma/schema.prisma`: `Tenant`, `User`, `UserCredential`, `UserSession`, `PasswordResetToken`, `CompanyMembership`, and related roles/companies.

## 3. Authentication and Authorization

### Access-token authentication

Protected routes require:

```http
Authorization: Bearer <access-token>
```

The access JWT is HS256 and contains `user_id`, `session_id`, `tenant_id`, optional `company_id`, `iat`, and `exp`. `authenticate` verifies the signature, required payload types, session identity/tenant, session expiry/revocation, user tenant, and active user status. It then sets `c.var.user`.

The access-token expiration uses `JWT_ACCESS_EXPIRES` when configured with a format such as `30m`, `1h`, or `1d`; the default is one hour. The exact environment value is deployment-specific and is not hardcoded by the module.

### Refresh-token authentication

Logout and refresh read the `refreshToken` cookie using Hono's cookie helper:

```http
Cookie: refreshToken=<refresh-token>
```

The backend does not set or clear browser cookies; the trusted frontend/server integration owns cookie handling. Refresh JWTs contain `user_id`, `session_id`, `iat`, and `exp`, use the refresh secret, and default to seven days unless `JWT_REFRESH_EXPIRES` overrides it. The database stores only a password hash of the full refresh token.

## 4. Endpoint Inventory

| Method | Effective Path              | Purpose                                         | Authentication       | Authorization                                   |
| ------ | --------------------------- | ----------------------------------------------- | -------------------- | ----------------------------------------------- |
| POST   | `/api/auth/signup`          | Create tenant, user, and credentials            | Public; rate limited | None                                            |
| POST   | `/api/auth/login`           | Verify credentials and create session/tokens    | Public; rate limited | Active user and unambiguous company membership  |
| POST   | `/api/auth/forgot-password` | Request reset email                             | Public; rate limited | None; response is account-enumeration resistant |
| POST   | `/api/auth/reset-password`  | Consume reset token and change password         | Public reset token   | Valid unused/unexpired token                    |
| GET    | `/api/auth/:id`             | Retrieve the authenticated user's own record    | Access Bearer token  | Path ID must equal token user ID                |
| POST   | `/api/auth/logout`          | Revoke the current refresh-token session        | Refresh cookie       | Valid current refresh token                     |
| POST   | `/api/auth/refresh`         | Rotate refresh token and issue new access token | Refresh cookie       | Valid current refresh token/session             |
| POST   | `/api/auth/validate_token`  | Return validated access-token context           | Access Bearer token  | Valid access token/session                      |

## 5. Detailed Endpoint Contracts

### POST `/api/auth/signup`

**Purpose:** Creates a new tenant, active user, and password credential.

**Implementation:** Router -> `AuthController.createUser` -> `AuthService.register` -> `AuthRepository.registerUser`.

**Request Body:**

```json
{
  "first_name": "Ada",
  "last_name": "Lovelace",
  "email": "ada@example.com",
  "password": "a-strong-password",
  "confirmPassword": "a-strong-password"
}
```

`first_name` and `last_name` must be 3-40 characters. Email is normalized to trimmed lowercase and must be valid. Password and confirmation must be 12-128 characters and equal. The schema is not strict, so unknown body keys are not explicitly rejected.

**Success Response:** `201`:

```json
{
  "success": true,
  "message": "Account created successfully",
  "result": {
    "id": "user-uuid",
    "tenant_id": "tenant-uuid",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com",
    "status": "ACTIVE",
    "created_at": "2026-10-21T12:00:00.000Z",
    "updated_at": "2026-10-21T12:00:00.000Z"
  }
}
```

The returned Prisma user record does not include credentials. Passwords are hashed before persistence.

**Errors:** `409 CONFLICT` if the email already exists; `422 INVALID DATA` for validation; `500` for unhandled database/hash errors. No authentication is required.

**Business Rules and Side Effects:** The service creates a new random tenant ID. A Serializable transaction creates the tenant with `ACTIVE`/`FREE`, creates the active user, and creates the credential. No session or tokens are issued by signup.

### POST `/api/auth/login`

**Purpose:** Authenticates credentials and creates a 30-day server-side session with access and refresh tokens.

**Request Body:**

```json
{ "email": "ada@example.com", "password": "a-strong-password" }
```

Email is normalized lowercase and must be valid. Password must be 12-128 characters.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "result": {
    "accessToken": "<access-token>",
    "refreshToken": "<refresh-token>"
  }
}
```

Tokens are returned in JSON; this backend does not set cookies.

**Errors:** `401 UNAUTHORIZED` with `Invalid email or password` for unknown user, missing credentials, inactive user, or wrong password. `401` with `Multiple active company memberships found; company selection is required` when the user has more than one active company membership. `422` for invalid body; `500` for unhandled errors.

**Business Rules and Side Effects:** Only `ACTIVE` users authenticate. A user with zero active memberships can log in without `company_id`; exactly one active membership is embedded in the access token. The refresh token is hashed and persisted in a new `UserSession` with a 30-day expiry. The access-token expiry is environment-configured/default one hour.

### POST `/api/auth/forgot-password`

**Purpose:** Requests a password-reset email without revealing whether an account exists.

**Request Body:** `{ "email": "ada@example.com" }`; email is trimmed, lowercased, valid, and at most 255 characters.

**Success Response:** `200` for both existing and unknown accounts:

```json
{
  "success": true,
  "message": "If the account exists, password reset instructions have been sent."
}
```

**Errors:** `422` for invalid email; notification/provider failures propagate as `500` unless the notifier maps them; `401` is not used for unknown accounts.

**Business Rules and Side Effects:** For an existing account, the service generates a token formatted as `<token-id>.<secret>`, stores only a hash of the secret, and creates a one-hour reset record. It emails a link containing the raw token. For an unknown account it returns the same success response without creating or sending a reset.

### POST `/api/auth/reset-password`

**Purpose:** Consumes a valid password-reset token and changes the user's password.

**Request Body:**

```json
{
  "resetToken": "token-id.token-secret",
  "password": "a-new-strong-password",
  "confirmPassword": "a-new-strong-password"
}
```

`resetToken` must be 10-512 characters. Password must be 12-128 characters and equal confirmation.

**Success Response:** `200`:

```json
{ "success": true, "message": "Password reset successfully" }
```

**Errors:** `401` for malformed, unknown, already-used, expired, hash-mismatched, or concurrently consumed reset tokens; `404` if the token user/credential cannot be found; `422` for invalid body; `500` for other failures.

**Business Rules and Side Effects:** The reset token is atomically claimed, the password credential is updated, all other unused reset tokens for the user are marked used, and all active sessions are revoked in one transaction. A reset token is one-time use and expires after one hour.

### GET `/api/auth/:id`

**Purpose:** Retrieves the authenticated user's full repository record.

**Authentication:** Valid access Bearer token.

**Path Parameters:** `id` must be a UUID. It must equal the authenticated token's `user_id`; otherwise service returns `401 Cannot access another user's data`.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "User found",
  "data": {
    "checkUser": {
      "id": "user-uuid",
      "tenant_id": "tenant-uuid",
      "email": "ada@example.com",
      "first_name": "Ada",
      "last_name": "Lovelace",
      "status": "ACTIVE"
    }
  }
}
```

The service returns `{ checkUser }`; the repository lookup includes credentials and tenant internally, but the returned user object may therefore contain sensitive relation fields depending on Prisma serialization. The exact full shape should be treated as runtime-dependent and should not be assumed safe for public exposure.

**Errors:** `401` for missing authentication or another user's ID; `404` for missing user; `422` for invalid UUID; `500` for unhandled errors.

### POST `/api/auth/logout`

**Purpose:** Revokes the session identified by the refresh-token cookie.

**Authentication:** No access-token middleware; requires `refreshToken` cookie.

**Request Body:** None. The unused `logoutSchema` is not applied.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Logged out successfully",
  "result": { "revoked": true }
}
```

**Errors:** `401` with `Invalid refresh token` or `Refresh token is no longer valid` for missing/invalid/expired/revoked/mismatched/rotated tokens; `500` for unhandled errors.

**Side Effects:** Conditionally marks the matching `UserSession.revoked_at`. The backend does not clear the browser cookie.

### POST `/api/auth/refresh`

**Purpose:** Rotates the current refresh token and issues a new access/refresh-token pair.

**Authentication:** No access-token middleware; requires `refreshToken` cookie.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Session refreshed successfully",
  "result": {
    "accessToken": "<new-access-token>",
    "refreshToken": "<new-refresh-token>"
  }
}
```

**Errors:** `401` for malformed token, absent session, user mismatch/missing/inactive user, revoked/expired session, hash mismatch, or failed atomic rotation; `500` for unhandled errors.

**Business Rules and Side Effects:** The old refresh token must match the stored hash. The service resolves the current active company membership; multiple memberships produce `401` requiring company selection. The new refresh-token hash replaces the old hash only when the conditional update affects one row, preventing replay/concurrent reuse. Session expiry is not extended by rotation.

### POST `/api/auth/validate_token`

**Purpose:** Returns the identity/session context established by access-token middleware.

**Authentication:** Valid access Bearer token; the route explicitly applies `authenticate`.

**Success Response:** `200`:

```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user_id": "user-uuid",
    "session_id": "session-uuid",
    "tenant_id": "tenant-uuid",
    "company_id": "company-uuid"
  }
}
```

`company_id` may be absent from the token/context and is then omitted by JSON serialization.

**Errors:** `401` for missing/invalid/expired/revoked/mismatched token/session or inactive user; `500` for unhandled session lookup errors.

## 6. Shared Data Structures and Enums

### Access token

Payload fields: `user_id`, `session_id`, `tenant_id`, optional `company_id`, issued-at, and expiration. It is signed with HS256 using the access secret.

### Refresh token

Payload fields: `user_id`, `session_id`, issued-at, and expiration. It is signed with HS256 using the refresh secret. The raw token is returned to the trusted integration but only a hash is stored in `UserSession`.

### Password reset token

The raw token is `<token-id>.<token-secret>`. The database stores the token ID, a hash of the secret, expiry, and optional `used_at`; the raw token is only sent in the email link.

## 7. Cross-Endpoint Business Rules

- User email is unique within a tenant; signup creates a new tenant, so the initial account is isolated from other tenants.
- User status must be `ACTIVE` for login, refresh, and access-token middleware authentication.
- Active company membership determines the optional access-token `company_id`. Multiple active memberships block login/refresh until selection is supported.
- Refresh/logout operations use conditional session updates to prevent replay and concurrent token reuse.
- Password reset invalidates all active sessions and all other unused reset tokens.
- The backend returns tokens in JSON and does not set/clear cookies; cookie storage and deletion belong to the trusted frontend/server integration.
- Passwords, refresh tokens, and reset secrets are never persisted in plaintext.

## 8. Frontend Integration Notes

- Use `/api/auth`, not the legacy API paths or token-only response examples.
- Send JSON request bodies for signup/login/password flows. Send the refresh token as the `refreshToken` cookie for logout/refresh; ensure the integration preserves the cookie between responses.
- Treat `result.accessToken` and `result.refreshToken` as the live login/refresh response shape.
- Do not expose raw refresh/reset tokens to untrusted browser code beyond the intended secure integration path.
- Handle `401` uniformly for invalid credentials, access tokens, refresh tokens, and reset tokens; login intentionally does not reveal whether the email exists.
- Account creation does not log the user in; call login separately.
- A password reset invalidates existing sessions, so clients must authenticate again after reset.

### Browser authentication coordination

- The supported browser model is one active account per browser profile. Same-origin tabs share the `accessToken` and `refreshToken` cookies; separate browser profiles are required to use different accounts simultaneously.
- Browser login, signup, logout, explicit refresh, and access-token refresh-and-retry operations use the exclusive `linaw-auth-transition` Web Lock.
- The generic server-side backend proxy forwards the current access token and returns `401`; it does not independently refresh tokens or emit rotated authentication cookies.
- Concurrent `401` responses wait for the shared transition. A non-secret local revision marker lets waiting requests reuse a refresh already completed by another same-origin tab instead of rotating the same refresh token again.
- Browsers without Web Locks fail closed for coordinated authentication transitions and refresh retries. They do not silently fall back to an uncoordinated refresh path.
- `HttpOnly` cookies remain the only browser credential storage. The coordination marker contains no token or user credential.

## 9. Contract Gaps and Implementation Discrepancies

1. **The requested documentation location is stale.** The target is `authentication`, while the prompt names the Approval Workflow directory. This contract is stored in the actual target module directory.
2. **The legacy API document is stale.** It uses different request fields, paths, and token-only responses; the live contract returns `result` wrappers and exposes additional password/session routes.
3. **`GET /:id` returns a potentially over-broad object.** The repository includes credentials and tenant relations, and the service returns `{ checkUser }` without a dedicated safe projection. The exact serialized sensitive fields require runtime verification.
4. **Logout/refresh have no router-level access-token authentication.** They rely entirely on the refresh cookie and service validation, which is intentional but differs from protected access-token routes.
5. **The logout validator is unused.** `logoutSchema` expects a body/session ID, but the controller ignores it and reads only the `refreshToken` cookie.
6. **Refresh-token lifetime and access-token lifetime differ in source.** Sessions are fixed at 30 days; JWT expirations are environment-configured with defaults of seven days refresh and one hour access.
7. **Password reset notification failure is not mapped to a dedicated service-unavailable error.** The notifier error propagates to the generic `500` handler.
8. **Email lookup is not explicitly tenant-scoped in login.** `findUserWithCredentialsByEmail` queries by email alone even though user email uniqueness is tenant-scoped. The practical behavior with duplicate emails across tenants requires runtime/data verification.
9. **Company selection is not implemented for login/refresh.** Multiple active memberships produce an authentication error rather than accepting a client-selected company context.

## 10. Verification Summary

- **Verified endpoints:** 8 live router registrations.
- **Routes accounted for:** signup, login, forgot/reset password, authenticated user lookup, logout, refresh, and token validation in `authRouter.ts`, combined with `/api` and `/auth` mounts in `app.ts`.
- **Layers inspected:** application bootstrap, router, controller, service, repository, validators, password/JWT helpers, notification provider, authentication middleware, shared errors, Prisma user/session/reset models, and legacy API documentation.
- **Runtime testing:** not performed. This contract is based on static source inspection; no credentials, tokens, emails, or data-changing requests were used.
- **Unresolved questions:** exact full serialization of `GET /:id`, deployment cookie attributes handled by the external integration, and multi-tenant duplicate-email runtime behavior require runtime verification.
- **Files changed:** only `backend/src/modules/authentication/api_contract.md` for this task. No application source, frontend, Prisma schema, or migration files were modified.
