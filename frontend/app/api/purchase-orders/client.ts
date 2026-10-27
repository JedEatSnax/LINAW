import { authFetch } from "@/lib/auth-client";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "ISSUED"
  | "ORDERED"
  | "CANCELLED"
  | "COMPLETED";

export type PurchaseOrderItem = {
  id?: string;
  line_no: number;
  description: string;
  quantity: number | string;
  unit_of_measure: string;
  unit_price: number | string;
  total_price?: number | string;
};

type Company = {
  id?: string;
  legal_name?: string;
  display_name?: string;
};

type SupplierQuotationItem = {
  id?: string;
  line_no: number;
  quoted_quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
  remarks?: string | null;
  rfq_item?: {
    description?: string | null;
    specification?: string | null;
    unit_of_measure?: string | null;
  } | null;
};

export type PurchaseOrder = {
  id: string;
  po_number: string;
  status: PurchaseOrderStatus;
  currency_code: string;
  total_amount: number | string;
  purchase_requisition_id?: string | null;
  rfq_id?: string | null;
  supplier_quotation_id?: string | null;
  order_date?: string | null;
  expected_delivery_date?: string | null;
  company?: Company | null;
  supplier?: {
    id?: string;
    name?: string;
    legal_name?: string;
    supplier_code?: string;
    company?: Company | null;
  } | null;
  purchase_requisition?: {
    id?: string;
    pr_number?: string;
    purpose?: string | null;
    justification?: string | null;
    currency_code?: string;
    total_amount?: number | string;
    items?: Array<{
      id?: string;
      line_no: number;
      description: string;
      specification?: string | null;
      quantity: number | string;
      unit_of_measure: string;
      estimated_unit_cost: number | string;
      estimated_total_cost: number | string;
    }>;
  } | null;
  rfq?: { id?: string; rfq_number?: string; title?: string } | null;
  supplier_quotation?: {
    id?: string;
    quotation_number?: string;
    total_amount?: number | string;
    currency_code?: string;
    status?: string;
    items?: SupplierQuotationItem[];
  } | null;
  items?: PurchaseOrderItem[];
};

type ListResponse = { list: PurchaseOrder[]; total: number };

export class PurchaseOrderApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PurchaseOrderApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(`/api/purchase-orders${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;
  if (!response.ok)
    throw new PurchaseOrderApiError(
      body?.error ?? body?.message ?? "The purchase order request failed.",
      response.status,
    );
  return body as T;
}

export async function listPurchaseOrders(
  filters: { status?: PurchaseOrderStatus; referenceNo?: string } = {},
) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.referenceNo) params.set("referenceNo", filters.referenceNo);
  const query = params.toString();
  return request<ListResponse>(query ? `/?${query}` : "/");
}

export async function getPurchaseOrder(id: string) {
  return (await request<{ PO: PurchaseOrder }>(`/${id}`)).PO;
}

export async function orderPurchaseOrder(id: string) {
  return (await request<{ createdPO: PurchaseOrder }>(`/${id}`, {
    method: "POST",
  })).createdPO;
}

export async function completePurchaseOrder(id: string) {
  return (
    await request<{ completedPO: PurchaseOrder }>(`/${id}/complete`, {
      method: "POST",
    })
  ).completedPO;
}

export async function cancelPurchaseOrder(id: string) {
  return (
    await request<{ deletedPO: PurchaseOrder }>(`/${id}`, { method: "DELETE" })
  ).deletedPO;
}
