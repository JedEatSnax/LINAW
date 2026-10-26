import { proxyBackendRequest } from "../_lib/backend";

export async function GET(request: Request): Promise<Response> {
  const search = new URL(request.url).search;
  return proxyBackendRequest(request, `/supplier-invitations${search}`);
}

export async function POST(request: Request): Promise<Response> {
  return proxyBackendRequest(request, "/supplier-invitations");
}
