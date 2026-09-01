import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { poweredBy } from "hono/powered-by";
import { secureHeaders } from "hono/secure-headers";

import type { AuthType } from "../lib/auth.js";
import { globalErrorHandler } from "./middlewares/errorHandler.js";
import auth from "./routes/auth.js";
import ethersRoutes from "./routes/ethers.js";
import licenseRoutes from "./routes/licenses.js";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: AuthType;
}>().basePath("/api");

app.use("*", poweredBy());
app.use(secureHeaders());
app.use(prettyJSON());

app.use(
  "*",
  cors({
    origin: (_origin, c) => c.env.ALLOWED_ORIGIN || "*",
    credentials: true,
  }),
  secureHeaders({
    xFrameOptions: "SAMEORIGIN",
    xXssProtection: "1",
  }),
);

app.onError(globalErrorHandler);

app.route("/auth", auth);
app.route("/ethers", ethersRoutes);
app.route("/licenses", licenseRoutes);

app.get("/", (c) => c.text("LINAW API"));
app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

export default app;
