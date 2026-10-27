import { forwardBackendRequest } from "@/lib/backend-request";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await context.params;
  const path = `suppliers/supplier-invitations/validate/${token}`;

  return forwardBackendRequest(
    request,
    path,
    "GET",
    (candidate) => candidate === path,
    false,
  );
}
