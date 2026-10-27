import { authFetch } from "@/lib/auth-client";

export type AuditTrailRecord = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  result: string | null;
  createdAt: string;
  actorUserId: string | null;
  hash: {
    algorithm: string;
    value: string;
  } | null;
  blockchainRef: {
    transactionHash: string;
    blockNumber: string | null;
    anchoredAt: string;
  } | null;
};

export type AuditTrailPage = {
  records: AuditTrailRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AuditTrailFilters = {
  entityType: string;
  action: string;
  result: string;
  page: number;
  pageSize: number;
};

export type AuditTrailDetail = {
  audit: {
    id: string;
    tenant_id: string;
    actor_user_id: string | null;
    entity_type: string;
    entity_id: string;
    action: string;
    result: string | null;
    request_id: string | null;
    snapshot_json: unknown;
    created_at: string;
  };
  blockchain: {
    auditId: string;
    hashValue: string;
    eventType: string;
    anchoredAt: number;
  } | null;
};

export class AuditTrailApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuditTrailApiError";
    this.status = status;
  }
}

type ApiErrorBody = {
  message?: unknown;
  error?: { message?: unknown };
};

type RawAuditRecord = {
  id?: unknown;
  entity_type?: unknown;
  entity_id?: unknown;
  action?: unknown;
  result?: unknown;
  created_at?: unknown;
  actor_user_id?: unknown;
  hash?: { hash_algorithm?: unknown; hash_value?: unknown } | null;
  blockchain_ref?: {
    blockchain_transaction_hash?: unknown;
    block_number?: unknown;
    anchored_at?: unknown;
  } | null;
};

type RawAuditPage = {
  audit_trails?: RawAuditRecord[];
  pagination?: {
    page?: unknown;
    page_size?: unknown;
    total?: unknown;
    total_pages?: unknown;
  };
};

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function positiveInteger(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function mapRecord(raw: RawAuditRecord): AuditTrailRecord {
  return {
    id: stringValue(raw.id, "Unknown audit event"),
    entityType: stringValue(raw.entity_type, "Unknown entity"),
    entityId: stringValue(raw.entity_id, "Unknown entity"),
    action: stringValue(raw.action, "Unknown action"),
    result: nullableString(raw.result),
    createdAt: stringValue(raw.created_at),
    actorUserId: nullableString(raw.actor_user_id),
    hash: raw.hash
      ? {
          algorithm: stringValue(raw.hash.hash_algorithm, "Unknown algorithm"),
          value: stringValue(raw.hash.hash_value, "Unavailable"),
        }
      : null,
    blockchainRef: raw.blockchain_ref
      ? {
          transactionHash: stringValue(
            raw.blockchain_ref.blockchain_transaction_hash,
            "Unavailable",
          ),
          blockNumber: nullableString(raw.blockchain_ref.block_number),
          anchoredAt: stringValue(raw.blockchain_ref.anchored_at),
        }
      : null,
  };
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await authFetch(`/api/backend/auditTrail${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch {
    throw new AuditTrailApiError(
      "Unable to reach the audit service. Please try again.",
      0,
    );
  }

  const body = (await response.json().catch(() => null)) as
    | (T & ApiErrorBody)
    | null;
  if (!response.ok) {
    const errorMessage = body?.error?.message ?? body?.message;
    throw new AuditTrailApiError(
      typeof errorMessage === "string"
        ? errorMessage
        : "The audit request could not be completed.",
      response.status,
    );
  }

  if (!body) {
    throw new AuditTrailApiError(
      "The audit service returned an empty response.",
      502,
    );
  }

  return body as T;
}

export async function getAuditTrail(
  filters: AuditTrailFilters,
  signal?: AbortSignal,
): Promise<AuditTrailPage> {
  const query = new URLSearchParams({
    page: String(filters.page),
    page_size: String(filters.pageSize),
  });
  if (filters.entityType) query.set("entity_type", filters.entityType);
  if (filters.action) query.set("action", filters.action);
  if (filters.result) query.set("result", filters.result);

  const body = await request<{ success?: boolean; data?: RawAuditPage }>(
    `/?${query.toString()}`,
    signal,
  );
  if (!body || body.success !== true || !body.data) {
    throw new AuditTrailApiError(
      "The audit service returned an invalid response.",
      502,
    );
  }

  const pagination = body.data.pagination ?? {};
  return {
    records: (body.data.audit_trails ?? []).map(mapRecord),
    page: positiveInteger(pagination.page, filters.page),
    pageSize: positiveInteger(pagination.page_size, filters.pageSize),
    total: positiveInteger(pagination.total, 0),
    totalPages: positiveInteger(pagination.total_pages, 0),
  };
}

export async function getAuditTrailDetail(
  auditId: string,
  signal?: AbortSignal,
): Promise<AuditTrailDetail> {
  const query = new URLSearchParams({ audit_id: auditId });
  const body = await request<{ success?: boolean; data?: AuditTrailDetail }>(
    `/search?${query.toString()}`,
    signal,
  );
  if (!body || body.success !== true || !body.data?.audit) {
    throw new AuditTrailApiError("The audit event could not be found.", 404);
  }
  return body.data;
}
