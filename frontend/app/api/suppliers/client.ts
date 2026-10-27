import { authFetch } from "@/lib/auth-client";

export type Supplier = {
  supplier_id: string;
  supplier_code?: string | null;
  company_id?: string | null;
  legal_name?: string | null;
  display_name?: string | null;
  tax_id?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: unknown;
  supplier_status?: string | null;
  relationship_status?: string | null;
  relationship?: {
    relationship_id?: string;
    relationship_status?: string;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Invitation = {
  invitation_id: string;
  email: string;
  invitation_status: string;
  expires_at?: string | null;
  accepted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RfqItem = {
  id: string;
  description?: string | null;
  specification?: string | null;
  quantity?: string | number | null;
  unit_of_measure?: string | null;
  [key: string]: unknown;
};

export type Rfq = {
  id: string;
  rfq_number?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  closing_date?: string | null;
  published_at?: string | null;
  company?: {
    legal_name?: string | null;
    display_name?: string | null;
    name?: string | null;
  } | null;
  purchasing_company?: {
    legal_name?: string | null;
    display_name?: string | null;
    name?: string | null;
  } | null;
  items?: RfqItem[];
  [key: string]: unknown;
};

export type QuotationItem = {
  id?: string;
  rfq_item_id?: string;
  quoted_quantity?: string | number | null;
  unit_price?: string | number | null;
  line_total?: string | number | null;
  lead_time_days?: number | null;
  remarks?: string | null;
  [key: string]: unknown;
};

export type Quotation = {
  id: string;
  quotation_number?: string | null;
  rfq_id?: string | null;
  status?: string | null;
  currency_code?: string | null;
  total_amount?: string | number | null;
  valid_until?: string | null;
  created_at?: string | null;
  submitted_at?: string | null;
  rfq?: Rfq | null;
  items?: QuotationItem[];
  [key: string]: unknown;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { message?: string };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(`/api/backend/suppliers${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as Envelope<T> & {
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      body.error?.message ??
        body.message ??
        `Request failed (${response.status})`,
    );
  }
  return (body.data ?? body) as T;
}

export async function listSuppliers(): Promise<{
  suppliers: Supplier[];
  pagination?: { total?: number; total_pages?: number };
}> {
  return request("/suppliers-governance?limit=100");
}

export function getSupplier(supplierId: string): Promise<Supplier> {
  return request(`/suppliers-governce/${supplierId}`);
}

export function deactivateSupplier(supplierId: string): Promise<unknown> {
  return request(`/suppliers-governance/${supplierId}/relationship`, {
    method: "DELETE",
  });
}

export async function listInvitations(): Promise<{
  invitations: Invitation[];
  pagination?: { total?: number; total_pages?: number };
}> {
  return request("/supplier-invitations?limit=100");
}

export function createInvitation(email: string): Promise<Invitation> {
  return request("/supplier-invitations", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resendInvitation(invitationId: string): Promise<Invitation> {
  return request(`/supplier-invitations/${invitationId}/resend`, {
    method: "POST",
  });
}

export type InvitationPreview = {
  invitation_id: string;
  invitation_status: string;
  expires_at: string | null;
  onboarding_action: "EXISTING_COMPANY" | "REGISTER_COMPANY";
};

export function validateInvitation(token: string): Promise<InvitationPreview> {
  return authFetch(`/api/supplier-invitations/validate/${encodeURIComponent(token)}`, {
    cache: "no-store",
  }, { retryOnUnauthorized: false }).then(async (response) => {
    const body = (await response.json().catch(() => ({}))) as Envelope<InvitationPreview>;
    if (!response.ok) {
      throw new Error(body.error?.message ?? body.message ?? "This invitation is unavailable.");
    }
    return (body.data ?? body) as InvitationPreview;
  });
}

export function acceptInvitation(
  invitationId: string,
  token: string,
): Promise<unknown> {
  return request(`/supplier-invitations/${invitationId}/accept`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function listAvailableRfqs(): Promise<Rfq[]> {
  return request("/supplier-portal/rfqs");
}

export function getRfq(rfqId: string): Promise<Rfq> {
  return request(`/supplier-portal/rfqs/${rfqId}`);
}

export function listQuotations(): Promise<Quotation[]> {
  return request("/supplier-portal/quotations");
}

export function getQuotation(quotationId: string): Promise<Quotation> {
  return request(`/supplier-portal/quotations/${quotationId}`);
}

export type QuotationInput = {
  currency_code?: string;
  valid_until?: string;
  items: Array<{
    rfq_item_id: string;
    quoted_quantity: number;
    unit_price: number;
    lead_time_days?: number;
    remarks?: string;
  }>;
};

export function submitQuotation(
  rfqId: string,
  input: QuotationInput,
): Promise<Quotation> {
  return request(`/supplier-portal/rfqs/${rfqId}/quotations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
