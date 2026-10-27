import { env } from "cloudflare:workers";

const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

interface LoginResponse {
  success: boolean;
  message?: string;
  result?: {
    accessToken: string;
    refreshToken: string;
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    !("password" in body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    !body.email.trim() ||
    !body.password
  ) {
    return Response.json(
      { success: false, message: "Email and password are required." },
      { status: 400 },
    );
  }

  const apiUrl = (env as typeof env & { LINAW_API_URL?: string }).LINAW_API_URL;

  if (!apiUrl) {
    return Response.json(
      {
        success: false,
        message: "Authentication service is not configured.",
      },
      { status: 500 },
    );
  }

  let upstream: Response;

  try {
    const baseUrl = apiUrl.replace(/\/+$/, "");

    upstream = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to reach the authentication service.",
      },
      { status: 502 },
    );
  }

  let data: LoginResponse;

  try {
    data = (await upstream.json()) as LoginResponse;
  } catch {
    return Response.json(
      {
        success: false,
        message: "Invalid response from authentication service.",
      },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return Response.json(
      {
        success: false,
        message: data.message ?? "Login failed.",
      },
      {
        status: upstream.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const accessToken = data.result?.accessToken;
  const refreshToken = data.result?.refreshToken;

  if (
    data.success !== true ||
    typeof accessToken !== "string" ||
    !accessToken ||
    typeof refreshToken !== "string" ||
    !refreshToken
  ) {
    return Response.json(
      {
        success: false,
        message: "Invalid response from authentication service.",
      },
      { status: 502 },
    );
  }

  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";

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
    `refreshToken=${encodeURIComponent(refreshToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${REFRESH_TOKEN_MAX_AGE}${secure}`,
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: "Login successful.",
    }),
    {
      status: 200,
      headers,
    },
  );
}
