import { env } from "cloudflare:workers";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env["DATABASE_URL_UNPOOLED"],
  },
});
