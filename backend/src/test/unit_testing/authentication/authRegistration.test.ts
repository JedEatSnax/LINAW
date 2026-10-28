import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../modules/authentication/authPassword.js", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
  verifyPassword: vi.fn(),
}));

import { AuthService } from "../../../modules/authentication/authServices.js";
import { AuthRepository } from "../../../modules/authentication/authRepository.js";
import { verifyPassword } from "../../../modules/authentication/authPassword.js";
import { ConflictError } from "../../../shared/errors/appError.js";
import type { AppEnv } from "../../../config/env.js";

const repositoryMock = {
  findUserWithCredentialsByEmail: vi.fn(),
  registerUser: vi.fn(),
  findActiveCompanyMemberships: vi.fn().mockResolvedValue([]),
  createSession: vi.fn().mockResolvedValue({}),
};

const signupInput = {
  first_name: "Test",
  last_name: "Account",
  email: "test@example.com",
  password: "correct-horse-battery-staple",
  confirmPassword: "correct-horse-battery-staple",
};

function createService() {
  return new AuthService(
    repositoryMock as unknown as AuthRepository,
    {
      JWT_ACCESS_SECRET: "access-secret",
      JWT_REFRESH_SECRET: "refresh-secret",
      JWT_ACCESS_EXPIRES: "60m",
      JWT_REFRESH_EXPIRES: "7d",
    } as AppEnv,
  );
}

describe("AuthService registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("checks the email and persists registration through one repository operation", async () => {
    const user = {
      id: "user-id",
      tenant_id: "tenant-id",
      email: signupInput.email,
    };

    repositoryMock.findUserWithCredentialsByEmail
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: user.id,
        tenant_id: user.tenant_id,
        status: "ACTIVE",
        credentials: { password_hash: "hashed-password" },
      });
    vi.mocked(verifyPassword).mockResolvedValue(true);
    repositoryMock.registerUser.mockResolvedValue(user);

    const result = await createService().register(signupInput);

    expect(repositoryMock.findUserWithCredentialsByEmail).toHaveBeenCalledWith(
      signupInput.email,
    );

    expect(repositoryMock.registerUser).toHaveBeenCalledTimes(1);

    expect(repositoryMock.registerUser).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: signupInput.first_name,
        last_name: signupInput.last_name,
        email: signupInput.email,
        password_hash: "hashed-password",
      }),
    );

    expect(result).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    expect(repositoryMock.createSession).toHaveBeenCalledTimes(1);
  });

  it("rejects an already registered email without persisting", async () => {
    repositoryMock.findUserWithCredentialsByEmail.mockResolvedValue({
      id: "existing-user",
      email: signupInput.email,
    });

    await expect(createService().register(signupInput)).rejects.toBeInstanceOf(
      ConflictError,
    );

    expect(repositoryMock.registerUser).not.toHaveBeenCalled();
  });

  it("propagates registration persistence failures", async () => {
    const databaseError = new Error("Registration persistence failed");

    repositoryMock.findUserWithCredentialsByEmail.mockResolvedValue(null);
    repositoryMock.registerUser.mockRejectedValue(databaseError);

    await expect(createService().register(signupInput)).rejects.toBe(
      databaseError,
    );
  });
});
