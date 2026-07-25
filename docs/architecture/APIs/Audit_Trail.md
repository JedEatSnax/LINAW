# Audit Trail

---

## POST /api/audit-trails/verify/:auditId

### Description

Verify an audit trail entry against its recorded hash and blockchain reference.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| auditId | string | Yes | Audit trail identifier. |

### Request Body

```json
{
    "hash_value": "",
    "blockchain_network": "",
    "blockchain_tx_hash": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Audit trail verified successfully.",
    "data": {
        "audit_id": "",
        "hash_value": "",
        "blockchain_tx_hash": "",
        "verification_status": ""
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
    "message": "Insufficient privileges to verify audit trails."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Audit trail record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Audit trail is already verified or in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Audit verification failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/audit-trails/blockchain-anchor

### Description

Anchor an audit trail hash to the blockchain network.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "hash_value": "",
    "blockchain_network": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Audit trail anchored successfully.",
    "data": {
        "hash_value": "",
        "blockchain_network": "",
        "blockchain_tx_hash": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid blockchain anchor data."
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
    "message": "Insufficient privileges to anchor audit trails."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Audit trail already anchored or in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Blockchain anchoring validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/audit-trails

### Description

List audit trail records with optional filtering.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| module | string | No | Filters audit records by module name. |
| status | string | No | Filters audit records by status. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Audit trails retrieved successfully.",
    "data": {
        "audit_trails": []
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
    "message": "Insufficient privileges to view audit trails."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/audit-trails/:auditId

### Description

Retrieve a single audit trail record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| auditId | string | Yes | Audit trail identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Audit trail retrieved successfully.",
    "data": {
        "audit_id": "",
        "user_id": "",
        "action_type": "",
        "module_name": "",
        "record_id": "",
        "record_type": "",
        "action_timestamp": "",
        "status": ""
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
    "message": "Audit trail record not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/audit-trails?module=procurement

### Description

List audit trail records filtered by module.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| module | string | No | Filters audit records by module name. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Audit trails retrieved successfully.",
    "data": {
        "audit_trails": []
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
    "message": "Insufficient privileges to view audit trails."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/audit-trails?status=verified

### Description

List audit trail records filtered by verification status.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filters audit records by status. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Audit trails retrieved successfully.",
    "data": {
        "audit_trails": []
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
    "message": "Insufficient privileges to view audit trails."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/audit-trails?status=pending

### Description

List pending audit trail records.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filters audit records by status. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Audit trails retrieved successfully.",
    "data": {
        "audit_trails": []
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
    "message": "Insufficient privileges to view audit trails."
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

