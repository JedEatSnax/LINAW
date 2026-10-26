import { env } from "cloudflare:workers";

const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

interface RefreshResponse {
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
    details?: unknown;
  };
  result?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

function jsonResponse(
  body: { success: false; message: string },
  status: number,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getErrorMessage(
  data: RefreshResponse,
  fallback: string,
): string {
  return data.message ?? data.error?.message ?? fallback;
}

export async function POST(request: Request): Promise<Response> {
  const cookieHeader = request.headers.get("Cookie");

  const refreshCookie = cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("refreshToken="));

  const refreshToken = refreshCookie?.slice("refreshToken=".length);

  if (!refreshToken) {
    return jsonResponse(
      {
        success: false,
        message: "Refresh token is missing. Please sign in again.",
      },
      401,
    );
  }

  const apiUrl = (
    env as typeof env & { LINAW_API_URL?: string }
  ).LINAW_API_URL;

  if (!apiUrl) {
    return jsonResponse(
      {
        success: false,
        message: "Authentication service is not configured.",
      },
      500,
    );
  }

  let upstream: Response;

  try {
    const baseUrl = apiUrl.replace(/\/+$/, "");

    upstream = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });
  } catch {
    return jsonResponse(
      {
        success: false,
        message: "Unable to reach the authentication service.",
      },
      502,
    );
  }

  let data: RefreshResponse;

  try {
    data = (await upstream.json()) as RefreshResponse;
  } catch {
    return jsonResponse(
      {
        success: false,
        message: "Invalid response from authentication service.",
      },
      502,
    );
  }

  if (!upstream.ok || data.success !== true) {
    return jsonResponse(
      {
        success: false,
        message: getErrorMessage(
          data,
          "Your session could not be refreshed. Please sign in again.",
        ),
      },
      upstream.ok ? 502 : upstream.status,
    );
  }

  const accessToken = data.result?.accessToken;
  const newRefreshToken = data.result?.refreshToken;

  if (
    typeof accessToken !== "string" ||
    !accessToken ||
    typeof newRefreshToken !== "string" ||
    !newRefreshToken
  ) {
    return jsonResponse(
      {
        success: false,
        message: "Invalid response from authentication service.",
      },
      502,
    );
  }

  const secure =
    new URL(request.url).protocol === "https:" ? "; Secure" : "";

  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });

  headers.append(
    "Set-Cookie",
    `accessToken=${encodeURIComponent(accessToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${ACCESS_TOKEN_MAX_AGE}${secure}`,
  );

  headers.append(
    "Set-Cookie",
    `refreshToken=${encodeURIComponent(newRefreshToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${REFRESH_TOKEN_MAX_AGE}${secure}`,
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: data.message ?? "Session refreshed successfully.",
    }),
    {
      status: 200,
      headers,
    },
  );
}
