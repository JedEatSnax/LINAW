# Purchase Order Management

---

## POST /api/purchase-orders

### Description

Create a purchase order.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "po_number": "",
    "supplier_id": "",
    "company_id": "",
    "order_date": "",
    "status": "",
    "total_amount": 0,
    "created_by": "",
    "approved_by": "",
    "approval_timestamp": "",
    "line_items": []
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Purchase order created successfully.",
    "data": {
        "po_id": "",
        "po_number": "",
        "status": "",
        "total_amount": 0
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid purchase order data."
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
    "message": "Insufficient privileges to create purchase orders."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase order already exists or is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Purchase order validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/purchase-orders

### Description

List purchase orders with optional filtering.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filters purchase orders by status. |
| supplierId | string | No | Filters purchase orders by supplier. |
| referenceNo | string | No | Filters purchase orders by reference number. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase orders retrieved successfully.",
    "data": {
        "purchase_orders": []
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
    "message": "Insufficient privileges to view purchase orders."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/purchase-orders/:poId

### Description

Retrieve a purchase order record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| poId | string | Yes | Purchase order identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase order retrieved successfully.",
    "data": {
        "po_id": "",
        "po_number": "",
        "supplier_id": "",
        "company_id": "",
        "order_date": "",
        "status": "",
        "total_amount": 0
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
    "message": "Purchase order not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/purchase-orders/:poId

### Description

Update a purchase order.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| poId | string | Yes | Purchase order identifier. |

### Request Body

```json
{
    "po_number": "",
    "supplier_id": "",
    "company_id": "",
    "order_date": "",
    "status": "",
    "total_amount": 0,
    "line_items": []
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase order updated successfully.",
    "data": {
        "po_id": "",
        "po_number": "",
        "status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid purchase order update data."
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
    "message": "Insufficient privileges to update purchase orders."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase order not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase order is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Purchase order validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/purchase-orders/:poId/status

### Description

Update the status of a purchase order.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| poId | string | Yes | Purchase order identifier. |

### Request Body

```json
{
    "status": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase order status updated successfully.",
    "data": {
        "po_id": "",
        "status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid purchase order status data."
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
    "message": "Insufficient privileges to update purchase order status."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase order not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase order is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Purchase order validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/purchase-orders/:poId/submit

### Description

Submit a purchase order for approval.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| poId | string | Yes | Purchase order identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase order submitted successfully.",
    "data": {
        "po_id": "",
        "status": "submitted"
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
    "message": "Insufficient privileges to submit purchase orders."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase order not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase order is already submitted or in a conflicting state."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/purchase-orders/:poId/approve

### Description

Approve a submitted purchase order.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| poId | string | Yes | Purchase order identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase order approved successfully.",
    "data": {
        "po_id": "",
        "status": "approved",
        "approved_by": "",
        "approval_timestamp": ""
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
    "message": "Insufficient privileges to approve purchase orders."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase order not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase order is already processed or in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Purchase order validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/purchase-orders/:poId/reject

### Description

Reject a submitted purchase order.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| poId | string | Yes | Purchase order identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase order rejected successfully.",
    "data": {
        "po_id": "",
        "status": "rejected"
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
    "message": "Insufficient privileges to reject purchase orders."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase order not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase order is already processed or in a conflicting state."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## DELETE /api/purchase-orders/:poId

### Description

Delete a purchase order record where deletion is allowed.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| poId | string | Yes | Purchase order identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Purchase order deleted successfully.",
    "data": {
        "po_id": ""
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
    "message": "Insufficient privileges to delete purchase orders."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Purchase order not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Purchase order is in a conflicting state."
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

