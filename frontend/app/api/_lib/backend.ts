import { env } from "cloudflare:workers";

function getAccessToken(request: Request) {
  const accessCookie = request.headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("accessToken="));

  return accessCookie
    ? decodeURIComponent(accessCookie.slice("accessToken=".length))
    : null;
}

export async function proxyBackendRequest(
  request: Request,
  path: string,
): Promise<Response> {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return Response.json(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  const apiUrl = (env as typeof env & { LINAW_API_URL?: string }).LINAW_API_URL;
  if (!apiUrl) {
    return Response.json(
      { success: false, message: "Backend API is not configured." },
      { status: 500 },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  });
  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);

  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.text();

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api${path}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
      },
    );

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { success: false, message: "Unable to reach the backend API." },
      { status: 502 },
    );
  }
}
