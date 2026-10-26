export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type ApprovalAction = {
  id: string;
  action: string;
  actor: string;
  date: string;
  remarks?: string;
  level?: number;
};

export type ApprovalRequest = {
  id: string;
  entityId: string;
  requester: string;
  entityType: string;
  amount: number;
  currencyCode?: string;
  currentLevel: number;
  status: ApprovalStatus;
  submittedAt: string;
  approverRole?: string;
  actions: ApprovalAction[];
};

type RawApprovalRequest = {
  id?: unknown;
  entity_type?: unknown;
  entity_id?: unknown;
  requester_user_id?: unknown;
  current_level?: unknown;
  status?: unknown;
  submitted_at?: unknown;
  requester_user?: { first_name?: unknown; last_name?: unknown } | null;
  purchase_requisition?: {
    pr_number?: unknown;
    currency_code?: unknown;
    total_amount?: unknown;
  } | null;
  actions?: Array<{
    id?: unknown;
    action?: unknown;
    remarks?: unknown;
    acted_at?: unknown;
    acted_by_user?: { first_name?: unknown; last_name?: unknown } | null;
    level?: { level_no?: unknown } | null;
  }>;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: { message?: string };
};

export class ApprovalWorkflowApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApprovalWorkflowApiError";
    this.status = status;
  }
}

function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(
    String(value).toUpperCase(),
  );
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" && !(value instanceof Date)) return "Unknown date";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapRequest(raw: RawApprovalRequest): ApprovalRequest {
  const id = stringValue(raw.id, "");
  const status = String(raw.status ?? "").toUpperCase();
  const currentLevel = numberValue(raw.current_level, 1);
  const requester = [
    raw.requester_user?.first_name,
    raw.requester_user?.last_name,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ");

  if (!id || !isApprovalStatus(status) || !raw.entity_id) {
    throw new Error("The approval service returned an invalid request.");
  }

  const actions: ApprovalAction[] = [];
  if (raw.submitted_at) {
    actions.push({
      id: `${id}-submitted`,
      action: "SUBMITTED",
      actor: requester || "Requester",
      date: formatDate(raw.submitted_at),
    });
  }

  for (const action of raw.actions ?? []) {
    actions.push({
      id: stringValue(action.id, `${id}-${actions.length}`),
      action: stringValue(action.action, "UNKNOWN"),
      actor: [action.acted_by_user?.first_name, action.acted_by_user?.last_name]
        .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
        .join(" ") || "Unknown user",
      date: formatDate(action.acted_at),
      ...(typeof action.remarks === "string" && action.remarks.trim()
        ? { remarks: action.remarks }
        : {}),
      ...(action.level?.level_no !== undefined
        ? { level: numberValue(action.level.level_no) }
        : {}),
    });
  }

  return {
    id,
    entityId: stringValue(raw.purchase_requisition?.pr_number ?? raw.entity_id, String(raw.entity_id)),
    requester: requester || "Unknown requester",
    entityType: stringValue(raw.entity_type, "Approval request"),
    amount: numberValue(raw.purchase_requisition?.total_amount),
    ...(typeof raw.purchase_requisition?.currency_code === "string"
      ? { currencyCode: raw.purchase_requisition.currency_code }
      : {}),
    currentLevel,
    status,
    submittedAt: formatDate(raw.submitted_at),
    actions,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/backend/approval-workflows${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApprovalWorkflowApiError(
      "Unable to reach the approval service. Please try again.",
      0,
    );
  }

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || body?.success !== true || body.data === undefined) {
    throw new ApprovalWorkflowApiError(
      body?.error?.message ?? body?.message ?? "The approval request could not be completed.",
      response.status,
    );
  }

  return body.data;
}

export async function getApprovalRequests(
  status?: ApprovalStatus,
): Promise<ApprovalRequest[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await request<{ approval_requests?: RawApprovalRequest[] }>(query);
  return (data.approval_requests ?? []).map(mapRequest);
}

export async function getApprovalRequest(id: string): Promise<ApprovalRequest> {
  const data = await request<RawApprovalRequest>(`/${encodeURIComponent(id)}`);
  return mapRequest(data);
}

export async function submitApprovalDecision(
  id: string,
  decision: "approve" | "reject",
  remarks?: string,
): Promise<ApprovalRequest> {
  const data = await request<RawApprovalRequest>(
    `/${encodeURIComponent(id)}/${decision}`,
    decision === "reject"
      ? { method: "POST", body: JSON.stringify({ remarks }) }
      : { method: "POST" },
  );
  return mapRequest(data);
}
