# Authentication API — Integration Notes

## 1. Integration Status

**Status: Frontend integration completed, but end-to-end testing is still pending.**

The frontend authentication flows have been integrated with the LINAW backend authentication API:

- Signup
- Login
- Forgot Password
- Reset Password
- Refresh Token

Although the frontend requests and backend endpoints have been connected, **the authentication flows have not been fully tested end to end**.

### Why is testing incomplete?

The backend authentication implementation is still being finalized, and the Prisma schema has not yet been successfully migrated or deployed to the development database.

During testing, the forgot-password request successfully reached the backend authentication route, passed through the rate-limiting middleware, and reached Prisma. However, Prisma returned error `P2021` because the expected `public.User` table does not exist in the connected database.

This indicates that the database schema is not ready for complete authentication testing.

**Important:** Successful frontend integration does not mean the entire authentication system is confirmed to work.

Once the backend implementation and database schema are ready, the following flows must be tested end to end:

1. User signup
2. User login
3. Forgot-password request
4. Password reset
5. Access-token refresh

Testing should cover both successful requests and expected failure cases.

Until then, treat these integrations as **implemented but not fully verified**.

---

## 2. NixOS SSL Certificate Configuration

### Background

During local development on NixOS, we encountered SSL/TLS certificate trust issues while making HTTPS requests from the development environment.

The local system's CA certificate bundle was configured explicitly to help the relevant runtime or tooling locate trusted certificates.

The certificate bundle used was:

`/etc/ssl/certs/ca-bundle.crt`

The following environment variables were used during local troubleshooting:

```bash
export SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
export NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
```

`NODE_EXTRA_CA_CERTS` was also explored during debugging.

These settings are environment-specific troubleshooting measures, not requirements that should automatically be added to the application's source code.

### Will this prevent another developer from reproducing the integration?

**No. This should not prevent another developer from continuing the frontend/backend integration.**

The SSL certificate issue was encountered in our local NixOS development environment. Developers using other operating systems may not encounter the same problem or require these environment variables.

If another developer encounters a similar TLS certificate error, they should:

1. Identify which runtime or tool is making the HTTPS request.
2. Verify that the operating system's CA certificates are installed and accessible.
3. Configure the appropriate certificate environment variable if necessary.
4. Retry the operation and confirm that certificate verification succeeds.

The exact configuration may differ depending on the operating system and runtime.

**Do not disable TLS certificate verification to bypass the issue.**

Also, do not assume that `/etc/ssl/certs/ca-bundle.crt` exists on every operating system. It is the path used in our NixOS environment and should not be hardcoded as a universal requirement.

### Developer Handoff

The SSL workaround is intended to help reproduce our local development environment when the same issue occurs. It is not part of the authentication API contract, and other developers should not need to modify the frontend authentication implementation solely because of this NixOS-specific configuration.

---

## 3. Remaining Work

- [ ] Finish the backend authentication implementation.
- [ ] Successfully migrate or otherwise apply the Prisma schema to the intended development database.
- [ ] Confirm that the application connects to the correct database.
- [ ] Test signup, login, forgot password, reset password, and refresh end to end.
- [ ] Verify expected validation errors and authentication failure cases.
- [ ] Document any additional environment-specific setup required for local development.
- [ ] Update this note once end-to-end testing has been completed.

**Current conclusion:** The frontend authentication integration is in place, but full verification depends on completing the backend and database setup. The NixOS SSL certificate workaround is a separate local development concern and should not prevent other developers from continuing the integration.
