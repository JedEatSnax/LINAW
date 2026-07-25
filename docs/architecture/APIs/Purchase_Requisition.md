# Purchase Requisition

---

## POST /api/purchase-requisitions

### Description

Create a purchase requisition with its line items.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "requisition_number": "",
    "requester_id": "",
    "company_id": "",
    "request_date": "",
    "requisition_status": "",
    "justification": "",
    "total_estimated_amount": 0,
    "created_by": "",
    "submitted_at": "",
    "line_items": []
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Purchase requisition created successfully.",
    "data": {
        "requisition_id": "",
        "requisition_number": "",
        "requisition_status": "",
        "total_estimated_amount": 0
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid purchase requisition data."
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
    "message": "Insufficient privileges to create purchase requisitions."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase requisition already exists or is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Purchase requisition validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/purchase-requisitions

### Description

List purchase requisitions with optional filtering.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filters requisitions by status. |
| requesterId | string | No | Filters requisitions by requester. |
| referenceNo | string | No | Filters requisitions by reference number. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase requisitions retrieved successfully.",
    "data": {
        "purchase_requisitions": []
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
    "message": "Insufficient privileges to view purchase requisitions."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/purchase-requisitions/:requisitionId

### Description

Retrieve a purchase requisition and its tracking details.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requisitionId | string | Yes | Purchase requisition identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase requisition retrieved successfully.",
    "data": {
        "requisition_id": "",
        "requisition_number": "",
        "requester_id": "",
        "company_id": "",
        "requisition_status": "",
        "line_items": []
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
    "message": "Purchase requisition not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/purchase-requisitions/:requisitionId

### Description

Update an editable purchase requisition.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requisitionId | string | Yes | Purchase requisition identifier. |

### Request Body

```json
{
    "requisition_number": "",
    "requester_id": "",
    "company_id": "",
    "request_date": "",
    "requisition_status": "",
    "justification": "",
    "total_estimated_amount": 0,
    "line_items": []
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase requisition updated successfully.",
    "data": {
        "requisition_id": "",
        "requisition_number": "",
        "requisition_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid purchase requisition update data."
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
    "message": "Insufficient privileges to update purchase requisitions."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase requisition not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase requisition is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Purchase requisition validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/purchase-requisitions/:requisitionId/status

### Description

Update the status of a purchase requisition.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requisitionId | string | Yes | Purchase requisition identifier. |

### Request Body

```json
{
    "requisition_status": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase requisition status updated successfully.",
    "data": {
        "requisition_id": "",
        "requisition_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid requisition status data."
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
    "message": "Insufficient privileges to update requisition status."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase requisition not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase requisition status is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Purchase requisition validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/purchase-requisitions/:requisitionId/submit

### Description

Submit a draft purchase requisition for workflow processing.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requisitionId | string | Yes | Purchase requisition identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase requisition submitted successfully.",
    "data": {
        "requisition_id": "",
        "requisition_status": "submitted",
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
    "message": "Insufficient privileges to submit purchase requisitions."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase requisition not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase requisition is already submitted or in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Purchase requisition validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/purchase-requisitions/:requisitionId/cancel

### Description

Cancel a purchase requisition that is eligible for cancellation.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requisitionId | string | Yes | Purchase requisition identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase requisition cancelled successfully.",
    "data": {
        "requisition_id": "",
        "requisition_status": "cancelled"
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
    "message": "Insufficient privileges to cancel purchase requisitions."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase requisition not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase requisition is already cancelled or in a conflicting state."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/purchase-requisitions/:requisitionId/resubmit

### Description

Resubmit a purchase requisition after revision where allowed.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requisitionId | string | Yes | Purchase requisition identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase requisition resubmitted successfully.",
    "data": {
        "requisition_id": "",
        "requisition_status": "submitted",
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
    "message": "Insufficient privileges to resubmit purchase requisitions."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase requisition not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase requisition is in a conflicting state."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## DELETE /api/purchase-requisitions/:requisitionId

### Description

Delete a purchase requisition record where deletion is permitted.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| requisitionId | string | Yes | Purchase requisition identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase requisition deleted successfully.",
    "data": {
        "requisition_id": ""
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
    "message": "Insufficient privileges to delete purchase requisitions."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase requisition not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase requisition is in a conflicting state."
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

