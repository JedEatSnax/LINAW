# Delivery Verification

---

## POST /api/delivery-verifications

### Description

Create a delivery verification record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "delivery_id": "",
    "purchase_order_id": "",
    "supplier_id": "",
    "delivery_date": "",
    "delivery_status": "",
    "confirmation_status": "",
    "confirmed_by": "",
    "confirmation_timestamp": "",
    "notification_status": "",
    "remarks": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Delivery verification created successfully.",
    "data": {
        "delivery_id": "",
        "purchase_order_id": "",
        "supplier_id": "",
        "delivery_status": "",
        "confirmation_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid delivery verification data."
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
    "message": "Insufficient privileges to create delivery verifications."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Related purchase order or supplier record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Delivery verification already exists or is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Delivery verification validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/delivery-verifications

### Description

List delivery verification records with optional filtering.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filters delivery verifications by status. |
| purchaseOrderId | string | No | Filters delivery verifications by purchase order. |
| supplierId | string | No | Filters delivery verifications by supplier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Delivery verifications retrieved successfully.",
    "data": {
        "delivery_verifications": []
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
    "message": "Insufficient privileges to view delivery verifications."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/delivery-verifications/:deliveryId

### Description

Retrieve a delivery verification record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| deliveryId | string | Yes | Delivery verification identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Delivery verification retrieved successfully.",
    "data": {
        "delivery_id": "",
        "purchase_order_id": "",
        "supplier_id": "",
        "delivery_date": "",
        "delivery_status": "",
        "confirmation_status": ""
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
    "message": "Delivery verification record not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/delivery-verifications/:deliveryId/status

### Description

Update the status of a delivery verification record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| deliveryId | string | Yes | Delivery verification identifier. |

### Request Body

```json
{
    "delivery_status": "",
    "confirmation_status": "",
    "notification_status": "",
    "remarks": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Delivery verification status updated successfully.",
    "data": {
        "delivery_id": "",
        "delivery_status": "",
        "confirmation_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid delivery verification status data."
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
    "message": "Insufficient privileges to update delivery verification status."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Delivery verification record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Delivery verification is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Delivery verification validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/delivery-verifications/:deliveryId/confirm

### Description

Confirm a delivery verification record as delivered.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| deliveryId | string | Yes | Delivery verification identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Delivery confirmed successfully.",
    "data": {
        "delivery_id": "",
        "confirmation_status": "confirmed",
        "confirmation_timestamp": ""
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
    "message": "Insufficient privileges to confirm delivery."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Delivery verification record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Delivery is already confirmed or in a conflicting state."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/delivery-verifications/:deliveryId/notify

### Description

Send a delivery notification after successful confirmation.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| deliveryId | string | Yes | Delivery verification identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Delivery notification sent successfully.",
    "data": {
        "delivery_id": "",
        "notification_status": "sent"
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
    "message": "Insufficient privileges to send delivery notifications."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Delivery verification record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Delivery notification is in a conflicting state."
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

