import {
  columns,
  type PurchaseOrder,
} from "@/app/(protected-routes)/purchase-orders/column-definitions";
import { modal } from "@/app/(protected-routes)/purchase-orders/modal-definitions";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export async function getPurchaseOrder(): Promise<PurchaseOrder[]> {
  // TODO: Replace with actual backend API call
  // const res = await fetch('API_ENDPOINT');
  // return res.json();

  // Delete this array once API is connecte
  return [
    {
      id: "uuid-po-001",
      po_number: "PO-2026-001",
      issuer: "Maria Santos",
      expected_delivery_date: "2026-11-15",
      currency_code: "PHP",
      total: 475000.0,
      status: "ISSUED",
      items: [
        {
          line_no: 1,
          description: "Dell XPS 15 Laptops",
          quantity: 5,
          unit_of_measure: "EA",
          unit_price: 95000.0,
        },
      ],
    },
    {
      id: "uuid-po-002",
      po_number: "PO-2026-002",
      issuer: "Juan Dela Cruz",
      expected_delivery_date: "2026-10-30",
      currency_code: "USD",
      total: 2400.0,
      status: "ORDERED",
    },
    {
      id: "uuid-po-003",
      po_number: "PO-2026-003",
      issuer: "Elena Torralba",
      expected_delivery_date: "2026-12-01",
      currency_code: "PHP",
      total: 85000.0,
      status: "DRAFT",
    },
    {
      id: "uuid-po-004",
      po_number: "PO-2026-004",
      issuer: "Mark Tan",
      expected_delivery_date: "2026-10-25",
      currency_code: "USD",
      total: 150000.0,
      status: "COMPLETED",
    },
    {
      id: "uuid-po-005",
      po_number: "PO-2026-005",
      issuer: "Ana Reyes",
      expected_delivery_date: "2026-11-05",
      currency_code: "PHP",
      total: 68000.0,
      status: "CANCELLED",
    },
  ];
}

export default async function PurchaseOrderPage() {
  const data = await getPurchaseOrder();

  const metrics = data.reduce(
    (acc, item) => {
      const status = item.status?.toUpperCase();
      if (status === "DRAFT") acc.draft++;
      else if (status === "ISSUED") acc.issued++;
      else if (status === "CANCELLED") acc.cancelled++;
      else if (status === "ORDERED") acc.ordered++;
      else if (status === "COMPLETED") acc.completed++;
      return acc;
    },
    { ordered: 0, draft: 0, issued: 0, cancelled: 0, completed: 0 },
  );

  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Purchase Orders
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">
              Issue, track, and manage legally binding purchase orders issued to
              external suppliers and vendors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:self-center">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
            <Receipt className="h-3.5 w-3.5 text-primary" />
            <span>
              Total Orders:{" "}
              <strong className="font-semibold text-foreground">
                {data.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Draft
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.draft}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Issued
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.issued}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completed
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.completed}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ordered
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.ordered}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cancelled
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.cancelled}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="po_number"
        searchPlaceholder="Search PO number..."
        toolbarActions={modal}
        enableExport={true}
        //exportEndpoint="/api/purchase-order/export" // Temporarily disable the endpoint to force the client-side fallback
        // HTTP method logs:  GET /api/purchase-order/export?format=csv 404 in 161ms
        exportFileName="purchase-order"
      />
    </main>
  );
}
