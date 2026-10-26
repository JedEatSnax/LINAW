import { describe, expect, it } from "vitest";
import { resolveAppUrl } from "../../../config/env.js";

describe("createEnv", () => {
  it("accepts an absolute HTTP(S) APP_URL", () => {
    expect(resolveAppUrl("https://linaw.example")).toBe(
      "https://linaw.example",
    );
  });

  it("uses the local fallback when APP_URL is not configured", () => {
    expect(resolveAppUrl()).toBe("http://localhost:3000");
  });

  it("rejects a malformed APP_URL", () => {
    expect(() => resolveAppUrl("localhost:3000")).toThrow(
      "APP_URL must be an absolute HTTP(S) URL",
    );
  });
});
