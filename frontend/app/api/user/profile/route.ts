import { forwardBackendRequest } from "@/lib/backend-request";

const backendPath = "userManagementRouter/profile";

export async function GET(request: Request): Promise<Response> {
  return forwardBackendRequest(request, backendPath, "GET");
}

export async function PATCH(request: Request): Promise<Response> {
  return forwardBackendRequest(request, backendPath, "PATCH");
}
