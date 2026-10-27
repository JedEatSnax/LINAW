import { authFetch } from "@/lib/auth-client";

export type PurchaseRequisitionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";
export type RequisitionItem = {
  item_type: "GOODS" | "SERVICE" | "ASSET";
  description: string;
  specification: string;
  quantity: number;
  unit_of_measure: string;
  estimated_unit_cost: number;
  category_id?: string;
  needed_by_date?: string;
};
export type PurchaseRequisitionSummary = {
  requisition_id: string;
  requisition_number: string;
  requisition_status: PurchaseRequisitionStatus;
  workflow_code: string | null;
  total_estimated_amount: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
};
export type PurchaseRequisitionDetail = PurchaseRequisitionSummary & {
  id?: string;
  purpose?: string | null;
  justification?: string | null;
  priority?: string | null;
  needed_by_date?: string | null;
  submitted_at?: string | null;
  cancelled_at?: string | null;
  requested_by_user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  items?: Array<
    RequisitionItem & { line_number?: number; total_cost?: number }
  >;
  line_items?: Array<
    RequisitionItem & { line_number?: number; total_cost?: number }
  >;
  status_logs?: Array<{
    from_status?: string;
    to_status?: string;
    remarks?: string;
    acted_at?: string;
  }>;
};
export type CreatePurchaseRequisitionInput = {
  workflow_code: string;
  purpose?: string;
  justification: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  currency_code: string;
  needed_by_date?: string;
  items: RequisitionItem[];
};

export class PurchaseRequisitionApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PurchaseRequisitionApiError";
    this.status = status;
  }
}
type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: { message?: string };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await authFetch(`/api/purchase-requisition${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new PurchaseRequisitionApiError(
      "Unable to reach the requisition service. Please try again.",
      0,
    );
  }
  const body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || body?.success !== true || body.data === undefined)
    throw new PurchaseRequisitionApiError(
      body?.error?.message ??
        body?.message ??
        "The requisition request could not be completed.",
      response.status,
    );
  return body.data;
}
function numberValue(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}
function mapSummary(raw: PurchaseRequisitionSummary) {
  return {
    ...raw,
    total_estimated_amount: numberValue(raw.total_estimated_amount),
  };
}
export async function listPurchaseRequisitions() {
  const data = await request<{
    purchase_requisitions?: PurchaseRequisitionSummary[];
    total?: number;
  }>("");
  return {
    requisitions: (data.purchase_requisitions ?? []).map(mapSummary),
    total: data.total ?? 0,
  };
}
export async function getPurchaseRequisition(id: string) {
  const data = await request<PurchaseRequisitionDetail>(
    `/${encodeURIComponent(id)}`,
  );
  return {
    ...data,
    total_estimated_amount: numberValue(data.total_estimated_amount),
  };
}
export async function createPurchaseRequisition(
  input: CreatePurchaseRequisitionInput,
) {
  return mapSummary(
    await request<PurchaseRequisitionSummary>("/create", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}
export async function submitPurchaseRequisition(id: string) {
  return request<{
    requisition_id: string;
    requisition_status: PurchaseRequisitionStatus;
  }>(`/${encodeURIComponent(id)}/submit`, { method: "POST" });
}
export async function cancelPurchaseRequisition(id: string, remarks: string) {
  return request<{
    requisition_id: string;
    requisition_status: PurchaseRequisitionStatus;
  }>(`/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ remarks }),
  });
}
