import { env } from "cloudflare:workers";

function getApiUrl(): string | undefined {
  return (env as typeof env & { LINAW_API_URL?: string }).LINAW_API_URL;
}

function getCookie(request: Request, name: string): string | undefined {
  return request.headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function isSafePath(path: string): boolean {
  const normalized = path.replace(/\/+/g, "/").replace(/\/\.\//g, "/");
  return normalized === path && !normalized.includes("..") && !normalized.includes("%");
}

export async function forwardBackendRequest(
  request: Request,
  backendPath: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  allowedPath: (path: string) => boolean = isSafePath,
  requiresAuth = true,
): Promise<Response> {
  if (!isSafePath(backendPath) || !allowedPath(backendPath)) {
    return Response.json(
      { success: false, message: "Route is not available." },
      { status: 404 },
    );
  }

  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return Response.json(
      { success: false, message: "Backend service is not configured." },
      { status: 500 },
    );
  }

  const baseUrl = apiUrl.replace(/\/+$/, "");
  const targetUrl = `${baseUrl}/api/${backendPath}${new URL(request.url).search}`;
  const requestBody = method === "GET" || method === "DELETE"
    ? undefined
    : await request.arrayBuffer();
  const contentType = request.headers.get("Content-Type");
  if (!requiresAuth) {
    const upstream = await fetch(targetUrl, {
      method,
      headers: { Accept: "application/json" },
      ...(requestBody ? { body: requestBody } : {}),
      cache: "no-store",
    });

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  const accessToken = getCookie(request, "accessToken");

  if (!accessToken) {
    return Response.json(
      { success: false, message: "Your session has expired. Please sign in again." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const upstreamHeaders = new Headers({
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  });

  if (contentType) upstreamHeaders.set("Content-Type", contentType);

  let upstream = await fetch(targetUrl, {
    method,
    headers: upstreamHeaders,
    ...(requestBody ? { body: requestBody } : {}),
    cache: "no-store",
  });

  const headers = new Headers({
    "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    "Cache-Control": "no-store",
  });

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers,
  });
}