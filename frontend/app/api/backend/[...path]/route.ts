import { forwardBackendRequest } from "@/lib/backend-request";

const allowedPrefixes = [
  "userManagementRouter/profile",
  "PurchaseRequisition",
  "approval-workflows",
  "purchase-orders",
];

function isAllowedPath(path: string): boolean {
  return allowedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const path = (await context.params).path?.join("/") ?? "";
  return forwardBackendRequest(request, path, "GET", isAllowedPath);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const path = (await context.params).path?.join("/") ?? "";
  return forwardBackendRequest(request, path, "POST", isAllowedPath);
}
