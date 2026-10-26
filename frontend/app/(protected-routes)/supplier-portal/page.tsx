import {
  quotationColumns,
  type SupplierQuotation,
} from "@/app/(protected-routes)/supplier-portal/quotation-columns";
import { quotationModal } from "@/app/(protected-routes)/supplier-portal/quotation-modal";
import {
  rfqColumns,
  type SupplierPortalRFQ,
} from "@/app/(protected-routes)/supplier-portal/rfq-columns";
import { rfqModal } from "@/app/(protected-routes)/supplier-portal/rfq-modal";
import { DataTable } from "@/components/data-table";
import { MailQuestionMark, Tag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getSupplierPortalRFQs(): Promise<SupplierPortalRFQ[]> {
  return [
    {
      id: "rfq-uuid-001",
      rfq_number: "RFQ-20261020-001",
      title: "Office Hardware Refresh Q4",
      description: "Request for pricing on business laptops and peripherals.",
      status: "PUBLISHED",
      issue_date: "2026-10-20T10:00:00.000Z",
      closing_date: "2026-11-15T23:59:59.000Z", // Open
      items: [
        {
          id: "item-uuid-1",
          line_no: 1,
          description: "Business Laptop",
          quantity: "15",
          unit_of_measure: "EA",
          specification: "16GB RAM, 512GB SSD",
        },
        {
          id: "item-uuid-2",
          line_no: 2,
          description: "Wireless Mouse",
          quantity: "15",
          unit_of_measure: "EA",
          specification: null,
        },
      ],
    },
    {
      id: "rfq-uuid-002",
      rfq_number: "RFQ-20260910-042",
      title: "Server Rack Replacements",
      description: null,
      status: "PUBLISHED",
      issue_date: "2026-09-10T08:30:00.000Z",
      closing_date: "2026-10-01T23:59:59.000Z", // Closed/Expired
      items: [
        {
          id: "item-uuid-3",
          line_no: 1,
          description: "42U Server Rack",
          quantity: "3",
          unit_of_measure: "EA",
          specification: "Standard width",
        },
      ],
    },
  ];
}

async function getSupplierQuotations(): Promise<SupplierQuotation[]> {
  return [
    {
      id: "quotation-uuid-001",
      rfq_id: "rfq-uuid-001",
      status: "SUBMITTED",
      currency_code: "USD",
      total_amount: 1882.5,
      valid_until: "2026-11-15T23:59:59.000Z",
      created_at: "2026-10-21T10:15:00.000Z",
      items: [
        {
          id: "sq-item-uuid-1",
          rfq_item_id: "item-uuid-1",
          quoted_quantity: 15,
          unit_price: 125.5,
          lead_time_days: 14,
          remarks: "Delivery included",
        },
      ],
    },
    {
      id: "quotation-uuid-002",
      rfq_id: "rfq-uuid-042",
      status: "SELECTED",
      currency_code: "PHP",
      total_amount: 150000.0,
      valid_until: "2026-10-31T23:59:59.000Z",
      created_at: "2026-09-12T08:30:00.000Z",
      items: [
        {
          id: "sq-item-uuid-2",
          rfq_item_id: "item-uuid-3",
          quoted_quantity: 3,
          unit_price: 50000.0,
          lead_time_days: 30,
          remarks: "Standard 42U configuration",
        },
      ],
    },
  ];
}

export default async function SupplierManagementPage() {
  const rfqData = await getSupplierPortalRFQs();
  const quotationData = await getSupplierQuotations();

  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Supplier Portal
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">
              Review RFQs and quotations assigned to you
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:self-center">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
            <MailQuestionMark className="h-3.5 w-3.5 text-primary" />
            <span>
              Total RFQs:{" "}
              <strong className="font-semibold text-foreground">
                {rfqData.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span>
              Total Quotations:{" "}
              <strong className="font-semibold text-foreground">
                {quotationData.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="rfq" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-2 border rounded-2xl bg-transparent p-2">
          <TabsTrigger
            value="rfq"
            className="rounded-full px-6 py-4 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md"
          >
            <MailQuestionMark className="mr-2 size-4" />
            Available Request for Quotations
          </TabsTrigger>
          <TabsTrigger
            value="quotation"
            className="rounded-full px-6 py-4 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md"
          >
            <Tag className="mr-2 size-4" />
            My Quotations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rfq" className="space-y-6">
          <DataTable
            columns={rfqColumns}
            data={rfqData}
            searchKey="title"
            searchPlaceholder="Search title..."
            toolbarActions={rfqModal}
            enableExport={true}
            //exportEndpoint="/api/rfq/export" // Temporarily disable the endpoint to force the client-side fallback
            // HTTP method logs:  GET /api/rfq/export?format=csv 404 in 161ms
            exportFileName="rfq"
          />
        </TabsContent>

        <TabsContent value="quotation" className="space-y-6">
          <DataTable
            columns={quotationColumns}
            data={quotationData}
            searchKey="id"
            searchPlaceholder="Search quotation ID..."
            toolbarActions={quotationModal}
            enableExport={true}
            //exportEndpoint="/api/quotation/export" // Temporarily disable the endpoint to force the client-side fallback
            // HTTP method logs:  GET /api/quotation/export?format=csv 404 in 161ms
            exportFileName="quotation"
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
