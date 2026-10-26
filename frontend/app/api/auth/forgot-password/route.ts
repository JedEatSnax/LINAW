import { env } from "cloudflare:workers";

interface ForgotPasswordResponse {
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid JSON request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    typeof body.email !== "string" ||
    !body.email.trim()
  ) {
    return Response.json(
      { success: false, message: "A valid email address is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const email = body.email.trim();

  const apiUrl = (
    env as typeof env & { LINAW_API_URL?: string }
  ).LINAW_API_URL;

  if (!apiUrl) {
    return Response.json(
      { success: false, message: "Authentication service is not configured." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  let upstream: Response;

  try {
    upstream = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/api/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );
  } catch {
    return Response.json(
      { success: false, message: "Unable to reach the authentication service." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  let data: ForgotPasswordResponse;

  try {
    data = (await upstream.json()) as ForgotPasswordResponse;
  } catch {
    return Response.json(
      { success: false, message: "Invalid response from authentication service." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!upstream.ok || data.success !== true) {
    return Response.json(
      {
        success: false,
        message: "Unable to process your password reset request.",
      },
      {
        status: upstream.ok ? 502 : upstream.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  // Do not disclose whether the submitted email belongs to an account.
  return Response.json(
    {
      success: true,
      message:
        "If an account exists for that email, a password reset link will be sent shortly.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
