import { Hono } from "hono";
import { auth } from "../../lib/auth.js";
import type { AuthType } from "../../lib/auth.js";

const router = new Hono<{ Bindings: AuthType }>();

router.on(["POST", "GET"], "/*", (c) => {
  return auth.handler(c.req.raw);
});

export default router;
