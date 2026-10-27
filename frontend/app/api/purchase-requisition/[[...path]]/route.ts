import { forwardBackendRequest } from "@/lib/backend-request";

function backendPath(path?: string[]): string {
  const suffix = path?.join("/") ?? "";
  return suffix ? `PurchaseRequisition/${suffix}` : "PurchaseRequisition";
}

function isPurchaseRequisitionPath(path: string): boolean {
  return (
    path === "PurchaseRequisition" || path.startsWith("PurchaseRequisition/")
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  return forwardBackendRequest(
    request,
    backendPath((await context.params).path),
    "GET",
    isPurchaseRequisitionPath,
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  return forwardBackendRequest(
    request,
    backendPath((await context.params).path),
    "POST",
    isPurchaseRequisitionPath,
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  return forwardBackendRequest(
    request,
    backendPath((await context.params).path),
    "PATCH",
    isPurchaseRequisitionPath,
  );
}
