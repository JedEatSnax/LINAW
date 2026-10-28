import { z } from "zod";
import { authFetch } from "@/lib/auth-client";

const amountSchema = z.object({ currency_code: z.string(), value: z.string() });

const reportSchema = z.object({
  period: z.object({
    month: z.string(),
    start: z.string(),
    end_exclusive: z.string(),
    date_basis: z.string(),
  }),
  metric_definition: z.string(),
  summary: z.object({
    completed_purchase_order_count: z.number(),
    values_by_currency: z.array(amountSchema),
  }),
  categories: z.array(z.object({
    category: z.string(),
    currency_code: z.string(),
    value: z.string(),
    purchase_order_count: z.number(),
  })),
  requesters: z.array(z.object({
    requester_id: z.string().nullable(),
    requester_name: z.string(),
    currency_code: z.string(),
    value: z.string(),
    purchase_order_count: z.number(),
  })),
  records: z.array(z.object({
    id: z.string(),
    po_number: z.string(),
    completion_date: z.string().nullable(),
    supplier: z.string(),
    requester: z.string(),
    currency_code: z.string(),
    total_amount: z.string(),
    status: z.string(),
  })),
  limitations: z.array(z.string()),
});

export type CompletedProcurementReport = z.infer<typeof reportSchema>;

export async function getMonthlyCompletedProcurementReport(month: string) {
  const response = await authFetch(`/api/purchase-orders/reports/monthly-completed?month=${encodeURIComponent(month)}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const body = (await response.json().catch(() => null)) as { report?: unknown; message?: string } | null;
  if (!response.ok) throw new Error(body?.message ?? "The procurement report could not be loaded.");
  return reportSchema.parse(body?.report);
}
