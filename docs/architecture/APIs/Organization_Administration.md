# Organization Administration

---

## POST /api/org-admin/users

### Description

Create a user account within the organization administration scope.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "first_name": "",
    "last_name": "",
    "email": "",
    "password": "",
    "role_id": "",
    "account_status": "",
    "organization_id": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Organization user created successfully.",
    "data": {
        "user_id": "",
        "organization_id": "",
        "account_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid organization user data."
}
```

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to manage organization users."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Duplicate email or conflicting organization configuration."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/org-admin/users

### Description

List organization users.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Organization users retrieved successfully.",
    "data": {
        "organization_users": []
    }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to view organization users."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/org-admin/users/:userId

### Description

Retrieve an organization user.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | string | Yes | User identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Organization user retrieved successfully.",
    "data": {
        "user_id": "",
        "first_name": "",
        "last_name": "",
        "email": "",
        "account_status": ""
    }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Organization user not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/org-admin/users/:userId

### Description

Update an organization user.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | string | Yes | User identifier. |

### Request Body

```json
{
    "first_name": "",
    "last_name": "",
    "email": "",
    "password": "",
    "role_id": "",
    "organization_id": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Organization user updated successfully.",
    "data": {
        "user_id": "",
        "organization_id": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid organization user update data."
}
```

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to update organization users."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Organization user not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Duplicate email or conflicting organization configuration."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PATCH /api/org-admin/users/:userId/status

### Description

Update the account status of an organization user.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | string | Yes | User identifier. |

### Request Body

```json
{
    "account_status": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Organization user status updated successfully.",
    "data": {
        "user_id": "",
        "account_status": ""
    }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to update organization user status."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Organization user not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/org-admin/roles

### Description

List organization roles.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Organization roles retrieved successfully.",
    "data": {
        "organization_roles": []
    }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to view organization roles."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/org-admin/roles

### Description

Create or register an organization role.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "role_id": "",
    "organization_id": "",
    "account_status": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Organization role saved successfully.",
    "data": {
        "role_id": "",
        "organization_id": "",
        "account_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid organization role data."
}
```

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to manage organization roles."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Organization role is in a conflicting state."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/org-admin/roles/:roleId

### Description

Update an organization role.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| roleId | string | Yes | Role identifier. |

### Request Body

```json
{
    "role_id": "",
    "organization_id": "",
    "account_status": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Organization role updated successfully.",
    "data": {
        "role_id": "",
        "organization_id": ""
    }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to update organization roles."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Organization role not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Organization role is in a conflicting state."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/org-admin/settings

### Description

List organization settings.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Organization settings retrieved successfully.",
    "data": {
        "organization_settings": []
    }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to view organization settings."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/org-admin/settings

### Description

Create an organization setting.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "setting_key": "",
    "setting_value": "",
    "organization_id": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Organization setting saved successfully.",
    "data": {
        "setting_key": "",
        "setting_value": "",
        "organization_id": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid organization setting data."
}
```

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to manage organization settings."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/org-admin/settings/:settingId

### Description

Update an organization setting.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| settingId | string | Yes | Setting identifier. |

### Request Body

```json
{
    "setting_key": "",
    "setting_value": "",
    "organization_id": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Organization setting updated successfully.",
    "data": {
        "setting_key": "",
        "setting_value": ""
    }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to update organization settings."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Organization setting not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/org-admin/audit-logs

### Description

Retrieve administrative audit logs for the organization.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Audit logs retrieved successfully.",
    "data": {
        "audit_logs": []
    }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
    "success": false,
    "message": "Unauthorized access."
}
```

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to view audit logs."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

---

