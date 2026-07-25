# Supplier Management

---

## POST /api/suppliers

### Description

Create a supplier record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "supplier_name": "",
    "contact_person": "",
    "email": "",
    "phone_number": "",
    "address": "",
    "supplier_status": "",
    "registration_status": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Supplier created successfully.",
    "data": {
        "supplier_id": "",
        "supplier_name": "",
        "supplier_status": "",
        "registration_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid supplier data."
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
    "message": "Insufficient privileges to manage suppliers."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Supplier record already exists or is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Supplier validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/suppliers/:supplierId/invite

### Description

Generate a supplier onboarding invitation.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| supplierId | string | Yes | Supplier identifier. |

### Request Body

```json
{
    "invitation_email": "",
    "expires_at": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Supplier invitation created successfully.",
    "data": {
        "invitation_id": "",
        "invitation_token": "",
        "invitation_status": "",
        "expires_at": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid supplier invitation data."
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
    "message": "Insufficient privileges to invite suppliers."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Supplier record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Supplier invitation already exists or is in a conflicting state."
}
```

#### 410 Gone

```json
{
    "success": false,
    "message": "Supplier invitation link expired."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Supplier invitation validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/suppliers/:supplierId/resend-invite

### Description

Resend or regenerate a supplier onboarding invitation.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| supplierId | string | Yes | Supplier identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier invitation resent successfully.",
    "data": {
        "invitation_id": "",
        "invitation_token": "",
        "invitation_status": "",
        "expires_at": ""
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
    "message": "Insufficient privileges to resend supplier invitations."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Supplier invitation not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Supplier invitation is in a conflicting state."
}
```

#### 410 Gone

```json
{
    "success": false,
    "message": "Supplier invitation link expired."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/suppliers/:supplierId/quotations

### Description

Create a quotation for a supplier.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| supplierId | string | Yes | Supplier identifier. |

### Request Body

```json
{
    "rfq_id": "",
    "quotation_date": "",
    "quotation_total": 0,
    "quotation_status": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Quotation created successfully.",
    "data": {
        "quotation_id": "",
        "supplier_id": "",
        "rfq_id": "",
        "quotation_date": "",
        "quotation_total": 0,
        "quotation_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid quotation data."
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
    "message": "Insufficient privileges to manage quotations."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Supplier or RFQ record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Quotation already exists or is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Quotation validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/suppliers/:supplierId/archive

### Description

Archive a supplier record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| supplierId | string | Yes | Supplier identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier archived successfully.",
    "data": {
        "supplier_id": "",
        "supplier_status": "archived"
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
    "message": "Insufficient privileges to archive suppliers."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Supplier record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Supplier record is in a conflicting state."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/supplier-invitations/validate/:token

### Description

Validate a supplier invitation token.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| token | string | Yes | Supplier invitation token. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier invitation validated successfully.",
    "data": {
        "invitation_token": "",
        "invitation_status": "",
        "expires_at": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid invitation token."
}
```

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
    "message": "Supplier invitation not found."
}
```

#### 410 Gone

```json
{
    "success": false,
    "message": "Supplier invitation link expired."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/suppliers

### Description

List suppliers with optional filtering.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filters suppliers by status. |
| name | string | No | Filters suppliers by supplier name. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Suppliers retrieved successfully.",
    "data": {
        "suppliers": []
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
    "message": "Insufficient privileges to view suppliers."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/suppliers/:supplierId

### Description

Retrieve a supplier record by supplier identifier.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| supplierId | string | Yes | Supplier identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier retrieved successfully.",
    "data": {
        "supplier_id": "",
        "supplier_name": "",
        "contact_person": "",
        "email": "",
        "phone_number": "",
        "address": "",
        "supplier_status": "",
        "registration_status": ""
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
    "message": "Supplier record not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/suppliers/:supplierId/invitations

### Description

List invitation records for a supplier.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| supplierId | string | Yes | Supplier identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier invitations retrieved successfully.",
    "data": {
        "supplier_invitations": []
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
    "message": "Supplier record not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/suppliers/:supplierId/quotations

### Description

List quotations associated with a supplier.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| supplierId | string | Yes | Supplier identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier quotations retrieved successfully.",
    "data": {
        "supplier_quotations": []
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
    "message": "Supplier record not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/quotations/:quotationId

### Description

Retrieve a quotation record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| quotationId | string | Yes | Quotation identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Quotation retrieved successfully.",
    "data": {
        "quotation_id": "",
        "supplier_id": "",
        "rfq_id": "",
        "quotation_date": "",
        "quotation_total": 0,
        "quotation_status": ""
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
    "message": "Quotation record not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/quotations

### Description

List quotations by RFQ reference.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| rfqId | string | No | Filters quotations by RFQ identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Quotations retrieved successfully.",
    "data": {
        "quotations": []
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

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/suppliers/:supplierId

### Description

Update a supplier record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| supplierId | string | Yes | Supplier identifier. |

### Request Body

```json
{
    "supplier_name": "",
    "contact_person": "",
    "email": "",
    "phone_number": "",
    "address": "",
    "supplier_status": "",
    "registration_status": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier updated successfully.",
    "data": {
        "supplier_id": "",
        "supplier_name": "",
        "supplier_status": "",
        "registration_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid supplier update data."
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
    "message": "Insufficient privileges to update suppliers."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Supplier record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Supplier record is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Supplier validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/supplier-invitations/:invitationId/status

### Description

Update the status of a supplier invitation.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| invitationId | string | Yes | Supplier invitation identifier. |

### Request Body

```json
{
    "invitation_status": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier invitation status updated successfully.",
    "data": {
        "invitation_id": "",
        "invitation_status": ""
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
    "message": "Supplier invitation not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Supplier invitation is in a conflicting state."
}
```

#### 410 Gone

```json
{
    "success": false,
    "message": "Supplier invitation link expired."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/quotations/:quotationId

### Description

Update a quotation record.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| quotationId | string | Yes | Quotation identifier. |

### Request Body

```json
{
    "rfq_id": "",
    "quotation_date": "",
    "quotation_total": 0,
    "quotation_status": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Quotation updated successfully.",
    "data": {
        "quotation_id": "",
        "quotation_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid quotation update data."
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
    "message": "Insufficient privileges to update quotations."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Quotation record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Quotation is in a conflicting state."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Quotation validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## DELETE /api/quotations/:quotationId

### Description

Delete a quotation record where deletion is allowed.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| quotationId | string | Yes | Quotation identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Quotation deleted successfully.",
    "data": {
        "quotation_id": ""
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
    "message": "Insufficient privileges to delete quotations."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Quotation record not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Quotation is in a conflicting state."
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

