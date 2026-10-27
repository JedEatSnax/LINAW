import { authFetch } from "@/lib/auth-client";

export type RfqStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED";

export type ProcurementQueueItem = {
  id: string;
  pr_number: string;
  status: string;
  purpose?: string | null;
  justification?: string | null;
  currency_code?: string | null;
  total_amount?: number | string | null;
  approved_at?: string | null;
  requested_by_user?: { first_name?: string; last_name?: string } | null;
  items?: Array<{
    id?: string;
    line_no: number;
    description: string;
    quantity: number | string;
    unit_of_measure: string;
    specification?: string | null;
  }>;
};

export type Rfq = {
  id: string;
  rfq_number: string;
  purchase_requisition_id?: string | null;
  title: string;
  description?: string | null;
  status: RfqStatus;
  issue_date?: string | null;
  closing_date?: string | null;
  items?: Array<{
    id?: string;
    line_no: number;
    description: string;
    quantity: number | string;
    unit_of_measure: string;
    specification?: string | null;
  }>;
};

export type Quotation = {
  id: string;
  quotation_number: string;
  supplier_id: string;
  currency_code: string;
  total_amount: number | string;
  status: string;
  submitted_at?: string | null;
  valid_until?: string | null;
  supplier?: {
    id?: string;
    supplier_code?: string;
    name?: string;
    legal_name?: string;
  } | null;
};

export type RfqValidationDetails = Record<string, string[]>;

type RfqErrorBody = {
  message?: unknown;
  error?:
    | string
    | {
        code?: unknown;
        message?: unknown;
        details?: unknown;
      };
};

export class RfqApiError extends Error {
  readonly status: number;
  readonly details?: RfqValidationDetails;

  constructor(
    message: string,
    status: number,
    details?: RfqValidationDetails,
  ) {
    super(message);
    this.name = "RfqApiError";
    this.status = status;
    this.details = details;
  }
}

function validationDetails(value: unknown): RfqValidationDetails | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;

  const details: RfqValidationDetails = {};
  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      const strings = messages.filter(
        (message): message is string => typeof message === "string",
      );
      if (strings.length > 0) details[field] = strings;
    }
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

function errorMessage(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await authFetch(`/api/purchase-orders${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new RfqApiError(
      "Unable to reach the purchase order service. Please try again.",
      0,
    );
  }
  const body = (await response.json().catch(() => null)) as RfqErrorBody | null;
  if (!response.ok) {
    const error = body?.error;
    const structuredError =
      error && typeof error === "object" && !Array.isArray(error)
        ? error
        : undefined;

    throw new RfqApiError(
      errorMessage(
        typeof error === "string" ? error : structuredError?.message,
        errorMessage(body?.message, "The RFQ request failed."),
      ),
      response.status,
      validationDetails(structuredError?.details),
    );
  }
  return body as T;
}

export async function listProcurementQueue() {
  const response = await request<{ ApprovedPR?: ProcurementQueueItem[] }>(
    "/procurement-queue",
  );
  return response.ApprovedPR ?? [];
}

export async function createRfq(input: {
  purchase_requisition_id: string;
  title: string;
  description?: string;
  closing_date: string;
  rfq_items: Array<{
    line_no: number;
    description: string;
    quantity: number;
    unit_of_measure: string;
    specification: string;
  }>;
}) {
  return (
    await request<{ createRfq: Rfq }>("/rfqs", {
      method: "POST",
      body: JSON.stringify(input),
    })
  ).createRfq;
}

export async function publishRfq(id: string) {
  return request<{ published: { message: string } }>(
    `/rfqs/${encodeURIComponent(id)}/publish`,
    { method: "POST" },
  );
}

export async function listRfqs() {
  return (await request<{ list?: Rfq[] }>("/rfqs")).list ?? [];
}

export async function listRfqQuotations(id: string) {
  return (
    (
      await request<{ QuotationList?: Quotation[] }>(
        `/rfqs/${encodeURIComponent(id)}/quotations`,
      )
    ).QuotationList ?? []
  );
}

export async function selectRfqQuotation(
  rfqId: string,
  quotationId: string,
) {
  return request<{ selectedSupplier: unknown }>(
    `/rfqs/${encodeURIComponent(rfqId)}/quotations/${encodeURIComponent(quotationId)}/select`,
    { method: "POST" },
  );
}
