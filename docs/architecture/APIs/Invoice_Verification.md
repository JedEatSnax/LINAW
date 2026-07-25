# Invoice Verification

---

## POST /api/invoice-verifications/upload

### Description

Upload an invoice for verification.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "invoice_id": "",
    "purchase_order_id": "",
    "vendor_id": "",
    "invoice_number": "",
    "invoice_date": "",
    "invoice_total": 0,
    "uploaded_file": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Invoice uploaded successfully.",
    "data": {
        "invoice_id": "",
        "verification_status": "",
        "uploaded_file": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid invoice upload data."
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
    "message": "Insufficient privileges to upload invoices."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Related purchase order or vendor record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Invoice already exists or is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Invoice verification validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/invoice-verifications/verify/:invoiceId

### Description

Verify an uploaded invoice against related procurement records.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| invoiceId | string | Yes | Invoice identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Invoice verified successfully.",
    "data": {
        "invoice_id": "",
        "verification_status": "verified",
        "verified_by": "",
        "verification_timestamp": ""
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
    "message": "Insufficient privileges to verify invoices."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Invoice record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Invoice is already verified or in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Invoice verification failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/invoice-verifications/recheck/:invoiceId

### Description

Recheck a previously uploaded invoice.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| invoiceId | string | Yes | Invoice identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Invoice rechecked successfully.",
    "data": {
        "invoice_id": "",
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

#### 404 Not Found

```json
{
    "success": false,
    "message": "Invoice record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Invoice is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Invoice verification failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/invoice-verifications

### Description

List invoice verifications with optional filtering.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filters invoice verifications by status. |
| vendorId | string | No | Filters invoice verifications by vendor. |
| purchaseOrderId | string | No | Filters invoice verifications by purchase order. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Invoice verifications retrieved successfully.",
    "data": {
        "invoice_verifications": []
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
    "message": "Insufficient privileges to view invoice verifications."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/invoice-verifications/:invoiceId

### Description

Retrieve an invoice verification record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| invoiceId | string | Yes | Invoice identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Invoice verification retrieved successfully.",
    "data": {
        "invoice_id": "",
        "purchase_order_id": "",
        "vendor_id": "",
        "invoice_number": "",
        "invoice_date": "",
        "invoice_total": 0,
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

#### 404 Not Found

```json
{
    "success": false,
    "message": "Invoice record not found."
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

