import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { getPrisma } from "./prisma.js";
import { openAPI } from "better-auth/plugins";

export const auth = betterAuth({
  baseURL: env["BETTER_AUTH_URL"],
  basePath: "/api/auth",
  trustedOrigins: [env["ALLOWED_ORIGIN"] as string],
  database: prismaAdapter(getPrisma(), {
    provider: "postgresql",
  }),
  advanced: {
    database: {
      joins: true,
    },
  },
  user: {
    modelName: "User",
  },
  session: {
    modelName: "Session",
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [openAPI()],
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
