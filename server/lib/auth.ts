import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { getPrisma } from "./prisma.js";
import { openAPI, haveIBeenPwned, bearer, jwt } from "better-auth/plugins";

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
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [
    openAPI(),
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "This password was exposed in a public data breach. Please create a strong and unique password.",
    }),
    bearer(),
    jwt(),
  ],
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
