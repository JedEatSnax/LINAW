export type SupplierQuotationSubmittedEvent = {
  quotation_id: string;
  quotation_number: string;
  tenant_id: string;
  company_id: string;
  supplier_id: string;
  rfq_id: string;
  currency_code: string;
  total_amount: string;
  submitted_at: Date;
};
