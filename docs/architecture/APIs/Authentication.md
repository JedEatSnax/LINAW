# Authentication


## Authentication


POST /api/auth/signup


Request:

{
full_name:"",
email:"",
password:""
}


Response:

{
message:"Account created successfully"
}


---


POST /api/auth/login


Request:

{
email:"",
password:""
}


Response:

{
token:""
}


---

## Error Responses


400 Bad Request

401 Unauthorized

500 Server Error


### Invited Vendor

POST

/api/vendor/register

Request
{
    "Legal_Name": "...";,
    "Trade_Name": "...";,
    "Tax_Id": "...";,
    "Email": "...";,
    "Phone": "...";,
    "Website": "...";,
    "Registered_Address": {
        "Address_Line_1": "...";,
        "City": "...";,
        "Province": "...";,
        "Postal_Code": "...";,
        "Country": "...";,
    },
    
    "Primary_Contact_Name": {
        "Full_Name": "...";,
        "Position": "...";,
        "Email": "...";,
        "Phone": "...";
    },
    "Biling_Contact": {
        "Full_Name": "...";,
        "Email": "...";,
        "Phone": "...";
    },  
    "Supplier_Category": "...";,
    "Product_or_Services": {"...","..."},
    "Purchase_Order_Email": "...";,
    "Currency": "...";,
    "Payment_Terms": "...";,
    "Tax_type": "...";,
    "Status": "...";,
    "is_Active": "...";
}

Response

{
  "id": "...";,
  "vendorCode": "...";,
  "status": "Pending Approval";,
}

---

