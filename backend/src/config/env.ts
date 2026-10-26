export type AppEnv = {
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_EXPIRES: string;

  REDIS_URL: string;
  REDIS_TOKEN: string;

  BLOCKCHAIN_RPC_URL: string;
  AUDIT_CONTRACT_ADDRESS: string;
  BLOCKCHAIN_PRIVATE_KEY: string;

  APP_URL: string;
  ALLOWED_ORIGIN: string;

  DATABASE_URL: string;

  NODE_ENV: string;

  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
  MAILGUN_FROM: string;
};

export function resolveAppUrl(appUrl?: string): string {
  const value = appUrl ?? "http://localhost:3000";

  try {
    const parsedAppUrl = new URL(value);

    if (!["http:", "https:"].includes(parsedAppUrl.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error("APP_URL must be an absolute HTTP(S) URL");
  }

  return value;
}

export function createEnv(bindings: CloudflareBindings): AppEnv {
  if (!bindings.ALLOWED_ORIGIN) {
    throw new Error("ALLOWED_ORIGIN is required");
  }

  if (!bindings.REDIS_URL) {
    throw new Error("REDIS_URL is required");
  }

  if (!bindings.REDIS_TOKEN) {
    throw new Error("REDIS_TOKEN is required");
  }

  if (!bindings.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is required");
  }

  if (!bindings.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is required");
  }

  if (!bindings.BLOCKCHAIN_RPC_URL) {
    throw new Error("BLOCKCHAIN_RPC_URL is required");
  }

  if (!bindings.AUDIT_CONTRACT_ADDRESS) {
    throw new Error("AUDIT_CONTRACT_ADDRESS is required");
  }

  if (!bindings.BLOCKCHAIN_PRIVATE_KEY) {
    throw new Error("BLOCKCHAIN_PRIVATE_KEY is required");
  }

  if (!bindings.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (!bindings.MAILGUN_API_KEY) {
    throw new Error("MAILGUN_API_KEY is required");
  }

  if (!bindings.MAILGUN_DOMAIN) {
    throw new Error("MAILGUN_DOMAIN is required");
  }

  if (!bindings.MAILGUN_FROM) {
    throw new Error("MAILGUN_FROM is required");
  }

  const jwtAccessExpires = bindings.JWT_ACCESS_EXPIRES ?? "60m";

  const jwtRefreshExpires = bindings.JWT_REFRESH_EXPIRES ?? "7d";

  const appUrl = resolveAppUrl(bindings.APP_URL);

  return {
    JWT_ACCESS_SECRET: bindings.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: bindings.JWT_REFRESH_SECRET,

    JWT_ACCESS_EXPIRES: jwtAccessExpires,
    JWT_REFRESH_EXPIRES: jwtRefreshExpires,

    REDIS_URL: bindings.REDIS_URL,
    REDIS_TOKEN: bindings.REDIS_TOKEN,

    BLOCKCHAIN_RPC_URL: bindings.BLOCKCHAIN_RPC_URL,
    AUDIT_CONTRACT_ADDRESS: bindings.AUDIT_CONTRACT_ADDRESS,
    BLOCKCHAIN_PRIVATE_KEY: bindings.BLOCKCHAIN_PRIVATE_KEY,

    APP_URL: appUrl,
    ALLOWED_ORIGIN: bindings.ALLOWED_ORIGIN,

    DATABASE_URL: bindings.DATABASE_URL,

    NODE_ENV: bindings.NODE_ENV ?? "development",

    MAILGUN_API_KEY: bindings.MAILGUN_API_KEY,
    MAILGUN_DOMAIN: bindings.MAILGUN_DOMAIN,
    MAILGUN_FROM: bindings.MAILGUN_FROM,
  };
}
