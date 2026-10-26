import { proxyBackendRequest } from "../../../_lib/backend";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ supplierId: string }> },
): Promise<Response> {
  const { supplierId } = await params;
  return proxyBackendRequest(request, `/suppliers/${supplierId}/relationship`);
}
