import { z } from "zod";

const numberLike = z.union([z.number(), z.string()]);

const requisitionSchema = z.object({
  requisition_id: z.string(),
  requisition_number: z.string(),
  requisition_status: z.string(),
  total_estimated_amount: numberLike,
  currency_code: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().nullable().optional(),
});

const approvalSchema = z.object({
  id: z.string(),
  entity_id: z.string(),
  entity_type: z.string(),
  requester_user_id: z.string(),
  current_level: z.number(),
  status: z.string(),
  submitted_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  requester_user: z.object({ first_name: z.string(), last_name: z.string() }).optional(),
  purchase_requisition: z.object({
    purpose: z.string().nullable().optional(),
    currency_code: z.string(),
    total_amount: numberLike,
  }).optional(),
});

const purchaseOrderSchema = z.object({
  id: z.string(),
  po_number: z.string(),
  status: z.string(),
  currency_code: z.string(),
  total_amount: numberLike,
  updated_at: z.string().optional(),
});

const rfqSchema = z.object({
  id: z.string(),
  rfq_number: z.string(),
  title: z.string(),
  status: z.string(),
  updated_at: z.string().optional(),
});

const quotationSchema = z.object({
  id: z.string(),
  quotation_number: z.string(),
  currency_code: z.string(),
  total_amount: numberLike,
  status: z.string(),
  rfq: z.object({ id: z.string(), rfq_number: z.string(), title: z.string() }),
  supplier: z.object({ id: z.string(), supplier_code: z.string() }),
});

type ApiResponse = { success?: boolean; message?: string; data?: unknown; list?: unknown; total?: unknown };

export type DashboardTransaction = {
  id: string;
  title: string;
  requester: string;
  amount: number | null;
  currency: string | null;
  status: string;
  updatedAt: string | null;
  category: "Requisition" | "RFQ" | "Purchase order";
  href: string;
};

export type DashboardApproval = {
  id: string;
  reference: string;
  title: string;
  requester: string;
  amount: number | null;
  currency: string | null;
  updatedAt: string | null;
};

export type DashboardData = {
  profile: { firstName: string; lastName: string } | null;
  companyName: string | null;
  requisitions: DashboardTransaction[];
  purchaseOrders: DashboardTransaction[];
  rfqs: DashboardTransaction[];
  requisitionTotal: number | null;
  approvalTotal: number | null;
  rfqTotal: number | null;
  quotationTotal: number | null;
  purchaseOrderTotal: number | null;
  approvals: DashboardApproval[];
  errors: string[];
  authFailed: boolean;
};

async function getJson(path: string, signal: AbortSignal): Promise<ApiResponse> {
  const response = await fetch(`/api/backend/${path}`, {
    signal,
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as ApiResponse;
}

function numericValue(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function dateValue(value: string | undefined | null): string | null {
  return value && !Number.isNaN(Date.parse(value)) ? value : null;
}

function totalValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export async function fetchDashboardData(signal: AbortSignal): Promise<DashboardData> {
  const results = await Promise.allSettled([
    getJson("userManagementRouter/profile", signal),
    getJson("PurchaseRequisition", signal),
    getJson("approval-workflows?status=PENDING", signal),
    getJson("purchase-orders/rfqs?status=PUBLISHED", signal),
    getJson("purchase-orders", signal),
    getJson("purchase-orders/quotations", signal),
  ]);

  const errors: string[] = [];
  let authFailed = false;
  const values = results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    if (result.reason instanceof Error && result.reason.message === "AUTHENTICATION_REQUIRED") {
      authFailed = true;
    }
    errors.push(`dashboard-section-${index}`);
    return null;
  });

  const profile = profileSchema.safeParse(values[0]?.data);
  const requisitions = z.array(requisitionSchema).safeParse(
    values[1]?.data && typeof values[1].data === "object" && values[1].data !== null
      ? (values[1].data as { purchase_requisitions?: unknown }).purchase_requisitions
      : undefined,
  );
  const approvalData = values[2]?.data;
  const approvalList = approvalData && typeof approvalData === "object" && approvalData !== null
    ? (approvalData as { approval_requests?: unknown }).approval_requests
    : approvalData;
  const approvals = z.array(approvalSchema).safeParse(approvalList);
  const rfqs = z.array(rfqSchema).safeParse(values[3]?.list);
  const purchaseOrders = z.array(purchaseOrderSchema).safeParse(values[4]?.list);
  const quotations = z.array(quotationSchema).safeParse(values[5]?.list);

  return {
    profile: profile.success
      ? {
          firstName: profile.data.first_name ?? "",
          lastName: profile.data.last_name ?? "",
        }
      : null,
    companyName: profile.success ? profile.data.company_name ?? null : null,
    requisitionTotal: totalValue(values[1]?.data && typeof values[1].data === "object" && values[1].data !== null
      ? (values[1].data as { total?: unknown }).total
      : null),
    approvalTotal: totalValue(approvalData && typeof approvalData === "object" && approvalData !== null
      ? (approvalData as { total?: unknown }).total
      : null),
    rfqTotal: totalValue(values[3]?.total),
    quotationTotal: quotations.success ? totalValue(values[5]?.total) : null,
    purchaseOrderTotal: totalValue(values[4]?.total),
    requisitions: requisitions.success
      ? requisitions.data.map((item) => ({
          id: item.requisition_number,
          title: "Purchase requisition",
          requester: "Unavailable",
          amount: numericValue(item.total_estimated_amount),
          currency: item.currency_code ?? null,
          status: item.requisition_status,
          updatedAt: dateValue(item.updated_at ?? item.created_at),
          category: "Requisition" as const,
          href: `/purchase-requisitions`,
        }))
      : [],
    purchaseOrders: purchaseOrders.success
      ? purchaseOrders.data.map((item) => ({
          id: item.po_number,
          title: "Purchase order",
          requester: "Unavailable",
          amount: numericValue(item.total_amount),
          currency: item.currency_code,
          status: item.status,
          updatedAt: dateValue(item.updated_at),
          category: "Purchase order" as const,
          href: `/purchase-orders/${item.id}`,
        }))
      : [],
    rfqs: rfqs.success
      ? rfqs.data.map((item) => ({
          id: item.rfq_number,
          title: item.title,
          requester: "Unavailable",
          amount: null,
          currency: null,
          status: item.status,
          updatedAt: dateValue(item.updated_at),
          category: "RFQ" as const,
          href: `/purchase-orders/rfqs/${item.id}`,
        }))
      : [],
    approvals: approvals.success
      ? approvals.data.map((item) => ({
          id: item.id,
          reference: item.entity_id,
          title: item.purchase_requisition?.purpose ?? item.entity_type,
          requester: item.requester_user
            ? `${item.requester_user.first_name} ${item.requester_user.last_name}`
            : "Unavailable",
          amount: item.purchase_requisition
            ? numericValue(item.purchase_requisition.total_amount)
            : null,
          currency: item.purchase_requisition?.currency_code ?? null,
          updatedAt: dateValue(item.updated_at ?? item.submitted_at),
        }))
      : [],
    errors,
    authFailed,
  };
}