import { forwardBackendRequest } from "@/lib/backend-request";

const allowedPath = (path: string) =>
  /^purchase-orders\/(?!$)[^?]+$/.test(path);

async function proxy(
  request: Request,
  method: "GET" | "POST" | "PATCH" | "DELETE",
) {
  const path = new URL(request.url).pathname.replace(/^\/api\//, "");
  return forwardBackendRequest(request, path, method, allowedPath);
}

export async function GET(request: Request) {
  return proxy(request, "GET");
}
export async function POST(request: Request) {
  return proxy(request, "POST");
}
export async function PATCH(request: Request) {
  return proxy(request, "PATCH");
}
export async function DELETE(request: Request) {
  return proxy(request, "DELETE");
}
