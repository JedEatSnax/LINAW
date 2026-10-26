import { describe, expect, it } from "vitest";
import { sign, verify } from "hono/jwt";
import type { AppEnv } from "../../../config/env.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../../modules/authentication/authJWT.js";

function createEnv(overrides: Partial<AppEnv> = {}): AppEnv {
  return {
    JWT_ACCESS_SECRET: "test-access-secret-with-sufficient-length",
    JWT_REFRESH_SECRET: "test-refresh-secret-with-sufficient-length",
    JWT_ACCESS_EXPIRES: "60m",
    JWT_REFRESH_EXPIRES: "7d",

    REDIS_URL: "https://redis.example.test",
    REDIS_TOKEN: "test-redis-token",

    BLOCKCHAIN_RPC_URL: "https://blockchain.example.test",
    AUDIT_CONTRACT_ADDRESS: "0x0000000000000000000000000000000000000000",
    BLOCKCHAIN_PRIVATE_KEY: "test-private-key",

    APP_URL: "https://linaw.example.test",
    ALLOWED_ORIGIN: "https://linaw.example.test",

    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    NODE_ENV: "test",

    MAILGUN_API_KEY: "test-mailgun-key",
    MAILGUN_DOMAIN: "example.test",
    MAILGUN_FROM: "LINAW Test <noreply@example.test>",

    ...overrides,
  };
}

const accessPayload = {
  user_id: "user-123",
  session_id: "session-456",
  tenant_id: "tenant-789",
  company_id: "company-012",
};

const refreshPayload = {
  user_id: "user-123",
  session_id: "session-456",
};

describe("JWT configuration and claims", () => {
  describe("generateAccessToken", () => {
    it("signs an access token with the configured secret and claims", async () => {
      const env = createEnv();
      const token = await generateAccessToken(accessPayload, env);

      const payload = await verify(token, env.JWT_ACCESS_SECRET, "HS256");

      expect(payload["user_id"]).toBe(accessPayload.user_id);
      expect(payload["session_id"]).toBe(accessPayload.session_id);
      expect(payload["tenant_id"]).toBe(accessPayload.tenant_id);
      expect(payload["company_id"]).toBe(accessPayload.company_id);
      expect(payload["iat"]).toEqual(expect.any(Number));
      expect(payload["exp"]).toEqual(expect.any(Number));
    });

    it("uses the configured access-token expiration", async () => {
      const env = createEnv({
        JWT_ACCESS_EXPIRES: "15m",
      });

      const token = await generateAccessToken(accessPayload, env);

      const payload = await verify(token, env.JWT_ACCESS_SECRET, "HS256");

      expect(typeof payload["exp"]).toBe("number");
      expect(typeof payload["iat"]).toBe("number");

      if (
        typeof payload["exp"] !== "number" ||
        typeof payload["iat"] !== "number"
      ) {
        throw new Error("JWT is missing numeric expiration claims");
      }

      expect(payload["exp"] - payload["iat"]).toBe(15 * 60);
    });

    it("rejects an explicitly empty expiration configuration", async () => {
      const env = createEnv({
        JWT_ACCESS_EXPIRES: "",
      });

      await expect(generateAccessToken(accessPayload, env)).rejects.toThrow();
    });

    it("rejects malformed and non-positive expiration values", async () => {
      for (const expiration of ["15", "0m", "-1h", "15x"]) {
        const env = createEnv({
          JWT_ACCESS_EXPIRES: expiration,
        });

        await expect(generateAccessToken(accessPayload, env)).rejects.toThrow();
      }
    });
  });

  describe("generateRefreshToken", () => {
    it("signs a refresh token with the configured secret and claims", async () => {
      const env = createEnv();
      const token = await generateRefreshToken(refreshPayload, env);

      const payload = await verify(token, env.JWT_REFRESH_SECRET, "HS256");

      expect(payload["user_id"]).toBe(refreshPayload.user_id);
      expect(payload["session_id"]).toBe(refreshPayload.session_id);
      expect(payload["iat"]).toEqual(expect.any(Number));
      expect(payload["exp"]).toEqual(expect.any(Number));
    });

    it("uses the configured refresh-token expiration", async () => {
      const env = createEnv({
        JWT_REFRESH_EXPIRES: "2d",
      });

      const token = await generateRefreshToken(refreshPayload, env);

      const payload = await verify(token, env.JWT_REFRESH_SECRET, "HS256");
      expect(typeof payload["exp"]).toBe("number");
      expect(typeof payload["iat"]).toBe("number");

      if (
        typeof payload["exp"] !== "number" ||
        typeof payload["iat"] !== "number"
      ) {
        throw new Error("JWT is missing numeric expiration claims");
      }

      expect(payload["exp"] - payload["iat"]).toBe(2 * 24 * 60 * 60);
    });

    it("rejects an explicitly empty expiration configuration", async () => {
      const env = createEnv({
        JWT_REFRESH_EXPIRES: "",
      });

      await expect(generateRefreshToken(refreshPayload, env)).rejects.toThrow();
    });
  });

  describe("verifyRefreshToken", () => {
    it("returns the expected user and session claims", async () => {
      const env = createEnv();
      const token = await generateRefreshToken(refreshPayload, env);

      await expect(verifyRefreshToken(token, env)).resolves.toEqual(
        refreshPayload,
      );
    });

    it("rejects a token signed with the wrong secret", async () => {
      const env = createEnv();
      const token = await sign(
        {
          ...refreshPayload,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60,
        },
        "a-different-refresh-secret",
        "HS256",
      );

      await expect(verifyRefreshToken(token, env)).rejects.toThrow();
    });

    it("rejects an expired refresh token", async () => {
      const env = createEnv();
      const now = Math.floor(Date.now() / 1000);

      const token = await sign(
        {
          ...refreshPayload,
          iat: now - 120,
          exp: now - 60,
        },
        env.JWT_REFRESH_SECRET,
        "HS256",
      );

      await expect(verifyRefreshToken(token, env)).rejects.toThrow();
    });

    it("rejects refresh tokens missing required claims", async () => {
      const env = createEnv();

      const token = await sign(
        {
          session_id: refreshPayload.session_id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60,
        },
        env.JWT_REFRESH_SECRET,
        "HS256",
      );

      await expect(verifyRefreshToken(token, env)).rejects.toThrow(
        "Invalid refresh token payload",
      );
    });

    it("rejects empty required claims", async () => {
      const env = createEnv();

      const token = await sign(
        {
          user_id: "",
          session_id: refreshPayload.session_id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60,
        },
        env.JWT_REFRESH_SECRET,
        "HS256",
      );

      await expect(verifyRefreshToken(token, env)).rejects.toThrow(
        "Invalid refresh token payload",
      );
    });

    it("uses the environment passed to each call without global state", async () => {
      const envA = createEnv({
        JWT_REFRESH_SECRET: "environment-a-refresh-secret",
      });

      const envB = createEnv({
        JWT_REFRESH_SECRET: "environment-b-refresh-secret",
      });

      const tokenA = await generateRefreshToken(refreshPayload, envA);
      const tokenB = await generateRefreshToken(refreshPayload, envB);

      await expect(verifyRefreshToken(tokenA, envA)).resolves.toEqual(
        refreshPayload,
      );

      await expect(verifyRefreshToken(tokenB, envB)).resolves.toEqual(
        refreshPayload,
      );

      await expect(verifyRefreshToken(tokenA, envB)).rejects.toThrow();

      await expect(verifyRefreshToken(tokenB, envA)).rejects.toThrow();
    });
  });
});
