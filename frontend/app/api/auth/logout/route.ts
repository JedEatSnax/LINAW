import { env } from "cloudflare:workers";

function getCookie(request: Request, name: string): string | undefined {
  return request.headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function clearSessionCookies(request: Request): Headers {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });

  headers.append(
    "Set-Cookie",
    `accessToken=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`,
  );
  headers.append(
    "Set-Cookie",
    `refreshToken=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`,
  );

  return headers;
}

export async function POST(request: Request): Promise<Response> {
  const refreshToken = getCookie(request, "refreshToken");

  if (!refreshToken) {
    return Response.json(
      { success: false, message: "Refresh token is missing." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const apiUrl = (env as typeof env & { LINAW_API_URL?: string }).LINAW_API_URL;

  if (!apiUrl) {
    return Response.json(
      { success: false, message: "Authentication service is not configured." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  let upstream: Response;

  try {
    upstream = await fetch(`${apiUrl.replace(/\/+$/, "")}/api/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to reach the authentication service.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  let data: { success?: boolean; message?: string };

  try {
    data = (await upstream.json()) as { success?: boolean; message?: string };
  } catch {
    return Response.json(
      {
        success: false,
        message: "Invalid response from authentication service.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!upstream.ok || data.success !== true) {
    return Response.json(
      { success: false, message: data.message ?? "Logout failed." },
      {
        status: upstream.ok ? 502 : upstream.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const headers = clearSessionCookies(request);
  return new Response(
    JSON.stringify({
      success: true,
      message: data.message ?? "Logged out successfully.",
    }),
    { status: 200, headers },
  );
}
