# Approval Workflow

---

## POST /api/approval-workflows/submit

### Description

Submit a business record into the approval workflow.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "request_id": "",
    "request_type": "",
    "requester_id": "",
    "approval_level": "",
    "approval_status": "",
    "submitted_at": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Approval request submitted successfully.",
    "data": {
        "request_id": "",
        "request_type": "",
        "approval_status": "pending",
        "submitted_at": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid approval workflow data."
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
    "message": "Insufficient privileges to submit approval requests."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Related business record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Approval request is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Approval workflow validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/approval-workflows

### Description

List approval workflow requests with optional filtering.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filters approval requests by status. |
| approverId | string | No | Filters approval requests by approver. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Approval requests retrieved successfully.",
    "data": {
        "approval_requests": []
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
    "message": "Insufficient privileges to view approval requests."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/approval-workflows/:requestId

### Description

Retrieve an approval workflow request and its status history.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requestId | string | Yes | Approval request identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Approval request retrieved successfully.",
    "data": {
        "request_id": "",
        "request_type": "",
        "requester_id": "",
        "approver_id": "",
        "approval_status": ""
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
    "message": "Approval request not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/approval-workflows/:requestId/status

### Description

Update the status of an approval workflow request.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requestId | string | Yes | Approval request identifier. |

### Request Body

```json
{
    "approval_status": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Approval workflow status updated successfully.",
    "data": {
        "request_id": "",
        "approval_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid approval status data."
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
    "message": "Insufficient privileges to update approval workflow status."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Approval request not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Approval request is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Approval workflow validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/approval-workflows/:requestId/approve

### Description

Approve a pending approval request.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requestId | string | Yes | Approval request identifier. |

### Request Body

```json
{
    "approver_id": "",
    "approval_status": "",
    "decision": "",
    "remarks": "",
    "decided_at": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Approval request approved successfully.",
    "data": {
        "request_id": "",
        "approval_status": "approved",
        "decided_at": ""
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
    "message": "Insufficient privileges to approve requests."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Approval request not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Approval request is already processed or in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Approval workflow validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/approval-workflows/:requestId/reject

### Description

Reject a pending approval request.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requestId | string | Yes | Approval request identifier. |

### Request Body

```json
{
    "approver_id": "",
    "approval_status": "",
    "decision": "",
    "remarks": "",
    "decided_at": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Approval request rejected successfully.",
    "data": {
        "request_id": "",
        "approval_status": "rejected",
        "decided_at": ""
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
    "message": "Insufficient privileges to reject requests."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Approval request not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Approval request is already processed or in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Approval workflow validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/approval-workflows/:requestId/cancel

### Description

Cancel an approval request where workflow rules allow.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requestId | string | Yes | Approval request identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Approval request cancelled successfully.",
    "data": {
        "request_id": "",
        "approval_status": "cancelled"
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
    "message": "Insufficient privileges to cancel approval requests."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Approval request not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Approval request is already cancelled or in a conflicting state."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/approval-workflows/:requestId/resubmit

### Description

Resubmit a cancelled approval request where workflow rules allow.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requestId | string | Yes | Approval request identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Approval request resubmitted successfully.",
    "data": {
        "request_id": "",
        "approval_status": "pending",
        "submitted_at": ""
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
    "message": "Insufficient privileges to resubmit approval requests."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Approval request not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Approval request is in a conflicting state."
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

