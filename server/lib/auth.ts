import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { getPrisma } from "./prisma.js";
import { openAPI, haveIBeenPwned, bearer, jwt } from "better-auth/plugins";

const authUrl = env.BETTER_AUTH_URL;
const allowedOrigins = env.ALLOWED_ORIGIN.split(",").map((o) => o.trim());

export const auth = betterAuth({
  appName: "LINAW",
  baseURL: authUrl,
  basePath: "/api/auth",
  trustedOrigins: allowedOrigins,
  database: prismaAdapter(getPrisma(), {
    provider: "postgresql",
  }),
  /**
  https://better-auth.com/docs/concepts/database#redis-storage
  secondaryStorage: redisStorage({
		client: redis,
		keyPrefix: "better-auth:", // optional, defaults to "better-auth:"
	}),
   */
  secret: env.BETTER_AUTH_SECRET,
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    database: {
      joins: true,
    },
    ipAddress: {
      disableIpTracking: false,
      ipAddressHeaders: ["X-Forwarded-For", "CF-Connecting-IP"],
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
      strategy: "jwe",
    },
  },
  useSecureCookies: authUrl.startsWith("https://"),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    openAPI(),
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "This password was exposed in a public data breach. Please create a strong and unique password.",
    }),
    bearer(),
    jwt({
      disableSettingJwtHeader: true,
      jwt: {
        issuer: authUrl,
        audience: authUrl,
        expirationTime: "15m",
        definePayload: ({ user }: { user: { id: string; email: string } }) => ({
          id: user.id,
          email: user.email,
        }),
      },
    }),
  ],
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
