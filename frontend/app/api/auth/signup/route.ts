import { env } from "cloudflare:workers";

interface SignupResponse {
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

const ACCESS_TOKEN_MAX_AGE = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

interface SignupRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  invitation_token?: string;
}

function getErrorMessage(data: SignupResponse, fallback: string): string {
  return data.message ?? data.error?.message ?? fallback;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message: "Invalid JSON request body.",
      },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return Response.json(
      {
        success: false,
        message: "Invalid signup request.",
      },
      { status: 400 },
    );
  }

  const input = body as Partial<SignupRequest>;

  if (
    typeof input.first_name !== "string" ||
    typeof input.last_name !== "string" ||
    typeof input.email !== "string" ||
    typeof input.password !== "string" ||
    typeof input.confirmPassword !== "string"
  ) {
    return Response.json(
      {
        success: false,
        message: "Please complete all required signup fields.",
      },
      { status: 400 },
    );
  }

  const firstName = input.first_name.trim();
  const lastName = input.last_name.trim();
  const email = input.email.trim();

  if (!firstName || !lastName || !email || !input.password) {
    return Response.json(
      {
        success: false,
        message: "Please complete all required signup fields.",
      },
      { status: 400 },
    );
  }

  if (input.password !== input.confirmPassword) {
    return Response.json(
      {
        success: false,
        message: "Passwords do not match.",
      },
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
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  let upstream: Response;

  try {
    const baseUrl = apiUrl.replace(/\/+$/, "");

    upstream = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password: input.password,
        confirmPassword: input.confirmPassword,
        ...(typeof input.invitation_token === "string"
          ? { invitation_token: input.invitation_token }
          : {}),
      }),
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to reach the authentication service.",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  let data: SignupResponse;

  try {
    data = (await upstream.json()) as SignupResponse;
  } catch {
    return Response.json(
      {
        success: false,
        message: "Invalid response from authentication service.",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  if (!upstream.ok || data.success !== true) {
    return Response.json(
      {
        success: false,
        message: getErrorMessage(data, "Unable to create your account."),
      },
      {
        status: upstream.ok ? 502 : upstream.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const accessToken = data.result?.accessToken;
  const refreshToken = data.result?.refreshToken;

  if (
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
      message: data.message ?? "Account created successfully.",
    }),
    { status: 201, headers },
  );
}
