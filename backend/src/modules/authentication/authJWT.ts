import { sign, verify } from "hono/jwt";
import type { AppEnv } from "../../config/env.js";

export interface AccessTokenPayload {
  user_id: string;
  session_id: string;
  tenant_id: string;
  company_id?: string;
}

export interface RefreshTokenPayload {
  user_id: string;
  session_id: string;
}

export async function generateAccessToken(
  payload: AccessTokenPayload,
  env: AppEnv,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = parseExpiration(env.JWT_ACCESS_EXPIRES, 60 * 60);

  return sign(
    {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    },
    env.JWT_ACCESS_SECRET,
    "HS256",
  );
}

export async function generateRefreshToken(
  payload: RefreshTokenPayload,
  env: AppEnv,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = parseExpiration(env.JWT_REFRESH_EXPIRES, 60 * 60 * 24 * 7);

  return sign(
    {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    },
    env.JWT_REFRESH_SECRET,
    "HS256",
  );
}

export async function verifyRefreshToken(
  token: string,
  env: AppEnv,
): Promise<RefreshTokenPayload> {
  const payload = await verify(token, env.JWT_REFRESH_SECRET, "HS256");

  if (
    typeof payload["user_id"] !== "string" ||
    payload["user_id"].length === 0 ||
    typeof payload["session_id"] !== "string" ||
    payload["session_id"].length === 0
  ) {
    throw new Error("Invalid refresh token payload");
  }

  return {
    user_id: payload["user_id"],
    session_id: payload["session_id"],
  };
}

function parseExpiration(
  expiresIn: string | undefined,
  defaultSeconds: number,
): number {
  if (expiresIn === undefined) {
    return defaultSeconds;
  }

  const match = expiresIn.match(/^(\d+)(s|m|h|d)$/);

  if (!match) {
    throw new Error(`Invalid JWT expiration format: ${expiresIn}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid JWT expiration value: ${expiresIn}`);
  }

  let seconds: number;

  switch (unit) {
    case "s":
      seconds = value;
      break;

    case "m":
      seconds = value * 60;
      break;

    case "h":
      seconds = value * 60 * 60;
      break;

    case "d":
      seconds = value * 60 * 60 * 24;
      break;

    default:
      throw new Error(`Unsupported JWT expiration unit: ${unit}`);
  }

  if (!Number.isSafeInteger(seconds)) {
    throw new Error(`JWT expiration exceeds the supported range: ${expiresIn}`);
  }

  return seconds;
}
