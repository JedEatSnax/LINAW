# Organization Administration — Reminder

## Dashboard / Root Endpoint

After the Organization Administration module is fully implemented, revisit whether the module needs a root dashboard endpoint:

```text
GET /api/organization-administration
```

### Current Approach

The module already has specific GET endpoints for its resources:

```text
GET /api/organization-administration/members
GET /api/organization-administration/roles
GET /api/organization-administration/permissions
GET /api/organization-administration/settings
```

For now, use these endpoints directly instead of creating an additional aggregated dashboard query.

### Revisit Later

Once the frontend/dashboard is being implemented, determine whether the Organization Administration page needs an overview/summary endpoint.

If needed, the root endpoint could return dashboard-level information such as:

- Total members
- Active members
- Pending invitations
- Total roles
- Other organization-level statistics

Example:

```text
GET /api/organization-administration
```

```json
{
  "memberCount": 42,
  "activeMemberCount": 38,
  "pendingInvitationCount": 3,
  "roleCount": 6
}
```

Do **not** make the root endpoint simply duplicate or internally call every existing GET endpoint. If an overview is needed, create a dedicated service/repository query containing only the summary data required by the dashboard.

## Priority

**Deferred until the core Organization Administration module and frontend are complete.**

Do not block the current backend implementation on this.
