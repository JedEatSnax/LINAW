import type { Context, Next } from "hono";
import type { AppContext } from "../../types/hono.js";

import { createRedis } from "./redis.js";
import { checkRateLimit } from "./rate-limiter.js";

export async function criticalRateLimit(
  c: Context<AppContext>,
  next: Next,
): Promise<void> {
  const user = c.get("user");

  const ip =
    c.req.header("CF-Connecting-IP") ??
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim();

  if (!ip) {
    throw new Error("Client IP is not available");
  }

  if (user && (!user.user_id || !user.session_id)) {
    throw new Error("Authenticated user or session is invalid");
  }

  // Public requests use an IP-based identity.
  // Authenticated requests retain their user and session identities.
  const userId = user?.user_id ?? `anonymous:${ip}`;
  const sessionId = user?.session_id ?? `anonymous:${ip}`;

  const redis = createRedis(c.env);

  const result = await checkRateLimit(redis, {
    userId,
    sessionId,
    ip,
    endpoint: c.req.path,
  });

  console.log("[RateLimit Middleware] Got result:", result);

  if (!result.allowed) {
    c.header("Retry-After", String(result.retryAfter));

    c.json(
      {
        success: false,
        error: "Too many requests",
        retryAfter: result.retryAfter,
        reason: result.reason,
      },
      429,
    );

    return;
  }

  await next();
}
