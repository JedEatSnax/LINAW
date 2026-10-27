import { forwardBackendRequest } from "@/lib/backend-request";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

function backendPath(path?: string[]): string | null {
  const parts = path ?? [];
  if (parts.length === 0) return null;

  if (parts[0] === "registration" && parts.length === 1) {
    return "userManagementRouter/companies/register";
  }

  const resource = parts[0];
  if (
    !["settings", "members", "roles", "permissions"].includes(resource ?? "")
  ) {
    return null;
  }

  return `organizationManagement/${parts.join("/")}`;
}

function allowedMethod(path: string, method: HttpMethod): boolean {
  if (path === "userManagementRouter/companies/register")
    return method === "POST";
  if (path === "organizationManagement/settings") {
    return method === "GET" || method === "PATCH";
  }
  if (path === "organizationManagement/members") {
    return method === "GET" || method === "POST";
  }
  if (/^organizationManagement\/members\/validate\/[^/]+$/.test(path)) {
    return method === "GET";
  }
  if (path === "organizationManagement/members/accept") {
    return method === "POST";
  }
  if (/^organizationManagement\/members\/[^/]+$/.test(path)) {
    return method === "PATCH" || method === "DELETE";
  }
  if (
    path === "organizationManagement/roles" ||
    path === "organizationManagement/permissions"
  ) {
    return method === "GET" || (path.endsWith("/roles") && method === "POST");
  }
  if (/^organizationManagement\/roles\/[^/]+$/.test(path)) {
    return method === "GET" || method === "PATCH" || method === "DELETE";
  }
  if (/^organizationManagement\/roles\/[^/]+\/permissions$/.test(path)) {
    return method === "GET" || method === "POST";
  }
  if (/^organizationManagement\/roles\/[^/]+\/permissions\/[^/]+$/.test(path)) {
    return method === "DELETE";
  }
  if (/^organizationManagement\/members\/[^/]+\/roles$/.test(path)) {
    return method === "POST";
  }
  if (/^organizationManagement\/members\/[^/]+\/roles\/[^/]+$/.test(path)) {
    return method === "DELETE";
  }
  return false;
}

async function forward(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
  method: HttpMethod,
): Promise<Response> {
  const path = backendPath((await context.params).path);
  if (!path || !allowedMethod(path, method)) {
    return Response.json(
      { success: false, message: "Organization route is not available." },
      { status: 404 },
    );
  }

  return forwardBackendRequest(
    request,
    path,
    method,
    (candidate) => candidate === path,
    !path.startsWith("organizationManagement/members/validate/"),
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return forward(request, context, "GET");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return forward(request, context, "POST");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return forward(request, context, "PATCH");
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  return forward(request, context, "DELETE");
}
