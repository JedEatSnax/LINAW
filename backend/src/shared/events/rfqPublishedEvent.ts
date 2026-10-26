export type RFQPublishedEvent = {
  rfq_number: string;
  tenant_id: string;
  company_id: string;
  title: string;
  description: string | null;
  quotation_deadline: Date | null;
  items: {
    id: string;
    description: string;
    quantity: unknown;
    unit: string;
  }[];
};
