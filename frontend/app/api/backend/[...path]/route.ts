import { forwardBackendRequest } from "@/lib/backend-request";

const allowedPrefixes = [
  "userManagementRouter/profile",
  "PurchaseRequisition",
  "approval-workflows",
  "purchase-orders",
  "auditTrail",
  "suppliers",
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const path = (await context.params).path?.join("/") ?? "";
  return forwardBackendRequest(request, path, "PATCH", isAllowedPath);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const path = (await context.params).path?.join("/") ?? "";
  return forwardBackendRequest(request, path, "DELETE", isAllowedPath);
}
