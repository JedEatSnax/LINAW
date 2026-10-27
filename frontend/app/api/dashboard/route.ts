import { forwardBackendRequest } from "@/lib/backend-request";

type DashboardSection =
  | "profile"
  | "requisitions"
  | "approvals"
  | "rfqs"
  | "purchaseOrders"
  | "quotations";

const sections: Array<{
  name: DashboardSection;
  path: string;
  search?: string;
}> = [
  { name: "profile", path: "userManagementRouter/profile" },
  { name: "requisitions", path: "PurchaseRequisition" },
  { name: "approvals", path: "approval-workflows", search: "?status=PENDING" },
  { name: "rfqs", path: "purchase-orders/rfqs", search: "?status=PUBLISHED" },
  { name: "purchaseOrders", path: "purchase-orders" },
  { name: "quotations", path: "purchase-orders/quotations" },
];

type SectionResult = {
  body: unknown | null;
  authFailed: boolean;
};

async function fetchSection(
  request: Request,
  path: string,
  search = "",
): Promise<SectionResult> {
  try {
    const url = new URL(request.url);
    url.search = search;
    const sectionRequest = new Request(url, request);
    const response = await forwardBackendRequest(sectionRequest, path, "GET");

    if (response.status === 401) {
      return { body: null, authFailed: true };
    }

    if (!response.ok) {
      return { body: null, authFailed: false };
    }

    return { body: await response.json(), authFailed: false };
  } catch {
    return { body: null, authFailed: false };
  }
}

export async function GET(request: Request): Promise<Response> {
  const results = await Promise.all(
    sections.map(async (section) => ({
      section,
      result: await fetchSection(request, section.path, section.search),
    })),
  );

  const data: Record<DashboardSection, unknown | null> = {
    profile: null,
    requisitions: null,
    approvals: null,
    rfqs: null,
    purchaseOrders: null,
    quotations: null,
  };
  const errors: string[] = [];
  let authFailed = false;

  for (const { section, result } of results) {
    data[section.name] = result.body;
    authFailed ||= result.authFailed;
    if (!result.body) errors.push(`dashboard-section-${section.name}`);
  }

  return Response.json(
    {
      success: true,
      data,
      errors,
      authFailed,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
