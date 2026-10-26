import { env } from "cloudflare:workers";

const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

type AuthResponse = {
  success?: boolean;
  result?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

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

function sessionCookies(request: Request, accessToken: string, refreshToken: string) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return [
    `accessToken=${encodeURIComponent(accessToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${ACCESS_TOKEN_MAX_AGE}${secure}`,
    `refreshToken=${encodeURIComponent(refreshToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${REFRESH_TOKEN_MAX_AGE}${secure}`,
  ];
}

async function refreshSession(
  request: Request,
  baseUrl: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const refreshToken = getCookie(request, "refreshToken");

  if (!refreshToken) return null;

  const response = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { Cookie: `refreshToken=${refreshToken}` },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as AuthResponse;
  const accessToken = data.result?.accessToken;
  const newRefreshToken = data.result?.refreshToken;

  if (
    data.success !== true ||
    typeof accessToken !== "string" ||
    typeof newRefreshToken !== "string"
  ) {
    return null;
  }

  return { accessToken, refreshToken: newRefreshToken };
}

export async function forwardBackendRequest(
  request: Request,
  backendPath: string,
  method: "GET" | "POST",
  allowedPath: (path: string) => boolean = isSafePath,
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
  const requestBody = method === "GET" ? undefined : await request.arrayBuffer();
  const contentType = request.headers.get("Content-Type");
  let accessToken = getCookie(request, "accessToken");
  let refreshedSession: { accessToken: string; refreshToken: string } | null = null;

  if (!accessToken) {
    refreshedSession = await refreshSession(request, baseUrl);
    accessToken = refreshedSession?.accessToken;
  }

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

  if (upstream.status === 401 && !refreshedSession) {
    refreshedSession = await refreshSession(request, baseUrl);

    if (refreshedSession) {
      upstreamHeaders.set(
        "Authorization",
        `Bearer ${refreshedSession.accessToken}`,
      );
      upstream = await fetch(targetUrl, {
        method,
        headers: upstreamHeaders,
        ...(requestBody ? { body: requestBody } : {}),
        cache: "no-store",
      });
    }
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    "Cache-Control": "no-store",
  });

  if (refreshedSession) {
    for (const cookie of sessionCookies(
      request,
      refreshedSession.accessToken,
      refreshedSession.refreshToken,
    )) {
      headers.append("Set-Cookie", cookie);
    }
  }

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers,
  });
}