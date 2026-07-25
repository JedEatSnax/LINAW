# Supplier Dashboard

---

## POST /api/supplier-dashboard/register-company

### Description

Complete supplier company onboarding using a valid invitation token.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "invitationtoken": "",
    "companyname": "",
    "companyaddress": "",
    "companyemail": "",
    "companycontactnumber": "",
    "taxidentificationnumber": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Supplier company registered successfully.",
    "data": {
        "suppliercompanyid": "",
        "companyname": "",
        "companyemail": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid supplier company registration data."
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
    "message": "Supplier company access is not allowed."
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
    "message": "Supplier onboarding is already completed or in a conflicting state."
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
    "message": "Supplier company onboarding validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## POST /api/supplier-dashboard/quotations

### Description

Submit a quotation for an eligible RFQ.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "rfqid": "",
    "suppliercompanyid": "",
    "quoteprice": 0,
    "quotedquantity": 0,
    "currency": "",
    "deliverydate": "",
    "quotevaliduntil": "",
    "leadtimedays": 0,
    "remarks": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Quotation submitted successfully.",
    "data": {
        "quotation_id": "",
        "rfqid": "",
        "suppliercompanyid": "",
        "quoteprice": 0,
        "quotation_status": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid quotation submission data."
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
    "message": "Supplier company access is not allowed for the requested record or dashboard action."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "RFQ not found."
}
```

#### 409 Conflict

```json
{
    "success": false,
    "message": "Quotation already submitted or the record is in a conflicting state."
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

## GET /api/supplier-dashboard/profile

### Description

Retrieve the supplier company profile for the authenticated supplier user.

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
    "message": "Supplier profile retrieved successfully.",
    "data": {
        "companyname": "",
        "companyaddress": "",
        "companyemail": "",
        "companycontactnumber": "",
        "taxidentificationnumber": ""
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
    "message": "Supplier company access is not allowed for the requested record or dashboard action."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Supplier profile not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/supplier-dashboard/rfqs

### Description

List RFQs assigned or made available to the supplier company.

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
    "message": "RFQs retrieved successfully.",
    "data": {
        "rfqs": []
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
    "message": "Supplier company access is not allowed for the requested record or dashboard action."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/supplier-dashboard/rfqs/:rfqId

### Description

Retrieve RFQ details for supplier quotation review.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| rfqId | string | Yes | RFQ identifier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "RFQ details retrieved successfully.",
    "data": {
        "rfqid": "",
        "suppliercompanyid": "",
        "rfq_items": []
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
    "message": "Supplier company access is not allowed for the requested record or dashboard action."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "RFQ not found."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/supplier-dashboard/orders

### Description

List purchase orders issued to the supplier company.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | No | Filters orders by ongoing or completed status. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier orders retrieved successfully.",
    "data": {
        "purchaseorders": []
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
    "message": "Supplier company access is not allowed for the requested record or dashboard action."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## PUT /api/supplier-dashboard/profile

### Description

Update the supplier company profile.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "companyname": "",
    "companyaddress": "",
    "companyemail": "",
    "companycontactnumber": "",
    "taxidentificationnumber": ""
}
```

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Supplier profile updated successfully.",
    "data": {
        "companyname": "",
        "companyaddress": "",
        "companyemail": "",
        "companycontactnumber": "",
        "taxidentificationnumber": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid supplier profile update data."
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
    "message": "Supplier company access is not allowed for the requested record or dashboard action."
}
```

#### 404 Not Found

```json
{
    "success": false,
    "message": "Supplier profile not found."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Supplier dashboard validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```
