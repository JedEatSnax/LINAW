import { forwardBackendRequest } from "@/lib/backend-request";

const allowedPath = (path: string) =>
  path === "purchase-orders" || /^purchase-orders\/(?!$)[^?]+$/.test(path);

async function proxy(request: Request, method: "GET" | "PATCH" | "DELETE") {
  const path = new URL(request.url).pathname
    .replace(/^\/api\//, "")
    .replace(/\/$/, "");
  return forwardBackendRequest(request, path, method, allowedPath);
}

export async function GET(request: Request) {
  return proxy(request, "GET");
}
export async function PATCH(request: Request) {
  return proxy(request, "PATCH");
}
export async function DELETE(request: Request) {
  return proxy(request, "DELETE");
}
