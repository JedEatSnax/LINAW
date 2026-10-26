import { env } from "cloudflare:workers";

interface ResetPasswordResponse {
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
  };
}

interface ResetPasswordRequest {
  resetToken: string;
  password: string;
  confirmPassword: string;
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

  if (typeof body !== "object" || body === null) {
    return Response.json(
      { success: false, message: "Invalid password reset request." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const input = body as Partial<ResetPasswordRequest>;

  if (
    typeof input.resetToken !== "string" ||
    !input.resetToken ||
    typeof input.password !== "string" ||
    typeof input.confirmPassword !== "string"
  ) {
    return Response.json(
      { success: false, message: "Please complete all required fields." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (
    input.password.length < 12 ||
    input.password.length > 128
  ) {
    return Response.json(
      {
        success: false,
        message: "Password must be between 12 and 128 characters.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (input.password !== input.confirmPassword) {
    return Response.json(
      { success: false, message: "Passwords do not match." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

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
      `${apiUrl.replace(/\/+$/, "")}/api/auth/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          resetToken: input.resetToken,
          password: input.password,
          confirmPassword: input.confirmPassword,
        }),
      },
    );
  } catch {
    return Response.json(
      { success: false, message: "Unable to reach the authentication service." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  let data: ResetPasswordResponse;

  try {
    data = (await upstream.json()) as ResetPasswordResponse;
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
        message:
          data.message ??
          data.error?.message ??
          "Unable to reset your password. Your link may have expired.",
      },
      {
        status: upstream.ok ? 502 : upstream.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return Response.json(
    {
      success: true,
      message: data.message ?? "Password reset successfully.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
