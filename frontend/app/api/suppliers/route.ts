import { proxyBackendRequest } from "../_lib/backend";

export async function GET(request: Request): Promise<Response> {
  const search = new URL(request.url).search;
  return proxyBackendRequest(request, `/suppliers${search}`);
}
