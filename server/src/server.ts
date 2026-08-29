import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { poweredBy } from "hono/powered-by";
import { secureHeaders } from "hono/secure-headers";

import userRoutes from "./routes/users.js";
import licenseRoutes from "./routes/licenses.js";
import ethersRoutes from "./routes/ethers.js";

const app = new Hono<{ Bindings: CloudflareBindings }>().basePath("/api");

app.use("*", poweredBy());
app.use(secureHeaders());
app.use(prettyJSON());

app.use(
  "*",
  cors({
    origin: (_origin, c) => c.env.ALLOWED_ORIGIN || "*",
  }),
  secureHeaders({
    xFrameOptions: "SAMEORIGIN",
    xXssProtection: "1",
  }),
);

app.get("/", (c) => c.text("LINAW API"));

app.route("/users", userRoutes);
app.route("/licenses", licenseRoutes);
app.route("/ethers", ethersRoutes);

app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

export default app;
