# Reporting

---

## POST /api/reports/export

### Description

Generate and export a report based on applied filters.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Request Body

```json
{
    "date_from": "",
    "date_to": "",
    "report_type": "",
    "format": "",
    "status": "",
    "supplier_id": "",
    "company_id": "",
    "document_type": ""
}
```

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Report exported successfully.",
    "data": {
        "report_request_id": "",
        "file_name": "",
        "format": "",
        "generated_path": "",
        "export_timestamp": ""
    }
}
```

### Error Responses

#### 400 Bad Request

```json
{
    "success": false,
    "message": "Invalid report export data."
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
    "message": "Insufficient privileges to export reports."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Report export validation failed."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/reports/dashboard

### Description

Retrieve dashboard summary data for procurement reporting.

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
    "message": "Dashboard data retrieved successfully.",
    "data": {
        "summary": {},
        "status_breakdown": {},
        "totals": {}
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
    "message": "Insufficient privileges to access the dashboard."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/reports/procurement-summary

### Description

Retrieve procurement summary report data.

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
    "message": "Procurement summary retrieved successfully.",
    "data": {
        "summary": {},
        "totals": {}
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
    "message": "Insufficient privileges to access procurement summary."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/reports/procurement-status

### Description

Retrieve procurement status report data.

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
    "message": "Procurement status retrieved successfully.",
    "data": {
        "status_breakdown": {}
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
    "message": "Insufficient privileges to access procurement status."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/reports/purchase-orders

### Description

Retrieve purchase order report data.

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
    "message": "Purchase order report retrieved successfully.",
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
    "message": "Insufficient privileges to access purchase order reports."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/reports/rfqs

### Description

Retrieve RFQ report data.

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
    "message": "RFQ report retrieved successfully.",
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
    "message": "Insufficient privileges to access RFQ reports."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/reports/quotations

### Description

Retrieve quotation report data.

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
    "message": "Quotation report retrieved successfully.",
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

#### 403 Forbidden

```json
{
    "success": false,
    "message": "Insufficient privileges to access quotation reports."
}
```

#### 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal server error."
}
```

## GET /api/reports

### Description

Retrieve filtered report data.

### Authentication

Bearer Token Required

### Headers

```text
Authorization: Bearer <access_token>
```

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| dateFrom | string | No | Start date for the report range. |
| dateTo | string | No | End date for the report range. |
| status | string | No | Filters records by status. |
| supplierId | string | No | Filters records by supplier. |

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Reports retrieved successfully.",
    "data": {
        "report_data": []
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
    "message": "Insufficient privileges to access reports."
}
```

#### 422 Validation Failed

```json
{
    "success": false,
    "message": "Invalid report filter range or unsupported report type."
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

