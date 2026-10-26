import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock("../../../modules/authentication/authPassword.js", () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
}));

vi.mock("../../../modules/authentication/authJWT.js", () => ({
  generateAccessToken: mocks.generateAccessToken,
  generateRefreshToken: mocks.generateRefreshToken,
  verifyRefreshToken: mocks.verifyRefreshToken,
}));

import { AuthService } from "../../../modules/authentication/authServices.js";
import { AuthRepository } from "../../../modules/authentication/authRepository.js";
import { UnauthorizedAccessError } from "../../../shared/errors/appError.js";
import type { AppEnv } from "../../../config/env.js";

const credentials = {
  email: "user@example.com",
  password: "correct-password",
};

const user = {
  id: "user-id",
  tenant_id: "tenant-id",
  status: "ACTIVE",
  credentials: {
    password_hash: "stored-password-hash",
  },
};

const repositoryMock = {
  findUserWithCredentialsByEmail: vi.fn(),
  findActiveCompanyMemberships: vi.fn(),
  createSession: vi.fn(),
};

function createService() {
  return new AuthService(
    repositoryMock as unknown as AuthRepository,
    {} as AppEnv,
  );
}

describe("AuthService login", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    repositoryMock.findUserWithCredentialsByEmail.mockResolvedValue({
      ...user,
      credentials: { ...user.credentials },
    });

    repositoryMock.findActiveCompanyMemberships.mockResolvedValue([
      { company_id: "company-id" },
    ]);

    repositoryMock.createSession.mockImplementation(
      async (input: unknown) => input,
    );

    mocks.verifyPassword.mockResolvedValue(true);
    mocks.hashPassword.mockResolvedValue("hashed-refresh-token");
    mocks.generateRefreshToken.mockResolvedValue("refresh-token");
    mocks.generateAccessToken.mockResolvedValue("access-token");
  });

  it("creates one session with the final refresh-token hash", async () => {
    const result = await createService().login(credentials);

    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    expect(repositoryMock.createSession).toHaveBeenCalledTimes(1);

    const sessionInput = repositoryMock.createSession.mock.calls[0]![0];

    expect(sessionInput).toEqual({
      id: expect.any(String),
      tenant_id: user.tenant_id,
      user_id: user.id,
      refresh_token_hash: "hashed-refresh-token",
      expires_at: expect.any(Date),
    });

    expect(mocks.generateRefreshToken).toHaveBeenCalledWith(
      {
        user_id: user.id,
        session_id: sessionInput.id,
      },
      expect.any(Object),
    );

    expect(mocks.generateAccessToken).toHaveBeenCalledWith(
      {
        user_id: user.id,
        session_id: sessionInput.id,
        tenant_id: user.tenant_id,
        company_id: "company-id",
      },
      expect.any(Object),
    );

    expect(mocks.hashPassword).toHaveBeenCalledWith("refresh-token");
  });

  it("rejects an unknown account with a generic authentication error", async () => {
    repositoryMock.findUserWithCredentialsByEmail.mockResolvedValue(null);

    await expect(createService().login(credentials)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.createSession).not.toHaveBeenCalled();
  });

  it("rejects an account without credentials", async () => {
    repositoryMock.findUserWithCredentialsByEmail.mockResolvedValue({
      ...user,
      credentials: null,
    });

    await expect(createService().login(credentials)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(repositoryMock.createSession).not.toHaveBeenCalled();
  });

  it("rejects inactive accounts", async () => {
    repositoryMock.findUserWithCredentialsByEmail.mockResolvedValue({
      ...user,
      status: "INACTIVE",
    });

    await expect(createService().login(credentials)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(repositoryMock.createSession).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password with a generic authentication error", async () => {
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(createService().login(credentials)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.createSession).not.toHaveBeenCalled();
  });

  it("rejects a user without an active company membership", async () => {
    repositoryMock.findActiveCompanyMemberships.mockResolvedValue([]);

    await expect(createService().login(credentials)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.createSession).not.toHaveBeenCalled();
  });

  it("rejects a user with multiple active company memberships", async () => {
    repositoryMock.findActiveCompanyMemberships.mockResolvedValue([
      { company_id: "company-a" },
      { company_id: "company-b" },
    ]);

    await expect(createService().login(credentials)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.createSession).not.toHaveBeenCalled();
  });
});
