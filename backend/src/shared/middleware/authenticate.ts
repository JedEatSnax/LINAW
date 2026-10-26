import type { Context, Next } from "hono";

import { verify } from "hono/jwt";
import type { AccessTokenPayload } from "../../modules/authentication/authJWT.js";
import { AuthRepository } from "../../modules/authentication/authRepository.js";
import type { AppContext } from "../types/hono.js";

import { UnauthorizedAccessError } from "../errors/appError.js";

export async function authenticate(
  c: Context<AppContext>,
  next: Next,
): Promise<void> {
  const header = c.req.header("Authorization");

  if (!header) {
    throw new UnauthorizedAccessError("Missing Token");
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedAccessError("Invalid Authorization Header");
  }

  let payload;

  try {
    payload = await verify(token, c.env.JWT_ACCESS_SECRET, "HS256");
  } catch {
    throw new UnauthorizedAccessError("Invalid Token");
  }

  if (
    typeof payload["user_id"] !== "string" ||
    payload["user_id"].length === 0 ||
    typeof payload["session_id"] !== "string" ||
    payload["session_id"].length === 0 ||
    typeof payload["tenant_id"] !== "string" ||
    payload["tenant_id"].length === 0 ||
    (payload["company_id"] !== undefined &&
      (typeof payload["company_id"] !== "string" ||
        payload["company_id"].length === 0))
  ) {
    throw new UnauthorizedAccessError("Invalid Token");
  }

  const session = await new AuthRepository().findSessionForAccessToken(
    payload["session_id"],
  );

  if (
    !session ||
    session.user_id !== payload["user_id"] ||
    session.tenant_id !== payload["tenant_id"] ||
    session.user.tenant_id !== payload["tenant_id"] ||
    session.revoked_at !== null ||
    session.expires_at <= new Date() ||
    session.user.status !== "ACTIVE"
  ) {
    throw new UnauthorizedAccessError("Invalid Token");
  }

  const user: AccessTokenPayload = {
    user_id: payload["user_id"],
    session_id: payload["session_id"],
    tenant_id: payload["tenant_id"],
    ...(typeof payload["company_id"] === "string"
      ? { company_id: payload["company_id"] }
      : {}),
  };

  c.set("user", user);

  await next();
}
