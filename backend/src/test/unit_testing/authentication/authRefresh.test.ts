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

const refreshToken = "presented-refresh-token";
const currentRefreshTokenHash = "stored-refresh-hash";

const session = {
  id: "session-id",
  tenant_id: "tenant-id",
  user_id: "user-id",
  refresh_token_hash: currentRefreshTokenHash,
  expires_at: new Date(Date.now() + 60_000),
  revoked_at: null,
};

const user = {
  id: "user-id",
  tenant_id: "tenant-id",
  status: "ACTIVE",
};

const repositoryMock = {
  findSessionById: vi.fn(),
  findUserById: vi.fn(),
  findActiveCompanyMemberships: vi.fn(),
  rotateSessionToken: vi.fn(),
  revokeSessionIfCurrent: vi.fn(),
};

let storedRefreshTokenHash: string;

function createService() {
  return new AuthService(
    repositoryMock as unknown as AuthRepository,
    {} as AppEnv,
  );
}

describe("AuthService refresh-token rotation", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    storedRefreshTokenHash = currentRefreshTokenHash;

    repositoryMock.findSessionById.mockResolvedValue({
      ...session,
    });

    repositoryMock.findUserById.mockResolvedValue({
      ...user,
    });

    repositoryMock.findActiveCompanyMemberships.mockResolvedValue([
      { company_id: "company-id" },
    ]);

    repositoryMock.revokeSessionIfCurrent.mockResolvedValue({
      count: 1,
    });

    mocks.verifyRefreshToken.mockResolvedValue({
      user_id: user.id,
      session_id: session.id,
    });

    mocks.verifyPassword.mockResolvedValue(true);
    mocks.hashPassword.mockResolvedValue("new-refresh-token-hash");

    mocks.generateAccessToken.mockResolvedValue("new-access-token");
    mocks.generateRefreshToken.mockResolvedValue("new-refresh-token");

    // Model the repository's conditional update:
    // only the request presenting the currently stored hash succeeds.
    repositoryMock.rotateSessionToken.mockImplementation(
      async (input: {
        session_id: string;
        current_refresh_token_hash: string;
        new_refresh_token_hash: string;
        now: Date;
      }) => {
        if (input.current_refresh_token_hash !== storedRefreshTokenHash) {
          return { count: 0 };
        }

        storedRefreshTokenHash = input.new_refresh_token_hash;

        return { count: 1 };
      },
    );
  });

  it("returns new tokens after successfully rotating the refresh token", async () => {
    const result = await createService().refresh(refreshToken);

    expect(result).toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    expect(mocks.verifyRefreshToken).toHaveBeenCalledWith(
      refreshToken,
      expect.any(Object),
    );

    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      currentRefreshTokenHash,
      refreshToken,
    );

    expect(repositoryMock.rotateSessionToken).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: session.id,
        current_refresh_token_hash: currentRefreshTokenHash,
        new_refresh_token_hash: "new-refresh-token-hash",
        now: expect.any(Date),
      }),
    );
  });

  it("rejects when the conditional update reports that the token is stale", async () => {
    repositoryMock.rotateSessionToken.mockResolvedValue({
      count: 0,
    });

    await expect(createService().refresh(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.rotateSessionToken).toHaveBeenCalledTimes(1);
  });

  it("rejects a revoked session without attempting rotation", async () => {
    repositoryMock.findSessionById.mockResolvedValue({
      ...session,
      revoked_at: new Date(),
    });

    await expect(createService().refresh(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.rotateSessionToken).not.toHaveBeenCalled();
  });

  it("rejects a refresh for an inactive user", async () => {
    repositoryMock.findUserById.mockResolvedValue({
      ...user,
      status: "INACTIVE",
    });

    await expect(createService().refresh(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.rotateSessionToken).not.toHaveBeenCalled();
  });

  it("rejects an expired session without attempting rotation", async () => {
    repositoryMock.findSessionById.mockResolvedValue({
      ...session,
      expires_at: new Date(Date.now() - 60_000),
    });

    await expect(createService().refresh(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.rotateSessionToken).not.toHaveBeenCalled();
  });

  it("rejects when the session does not exist", async () => {
    repositoryMock.findSessionById.mockResolvedValue(null);

    await expect(createService().refresh(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.rotateSessionToken).not.toHaveBeenCalled();
  });

  it("allows only one competing request to rotate the same refresh token", async () => {
    const service = createService();

    const results = await Promise.allSettled([
      service.refresh(refreshToken),
      service.refresh(refreshToken),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");

    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.rotateSessionToken).toHaveBeenCalledTimes(2);
  });

  it("rejects an invalid refresh JWT", async () => {
    mocks.verifyRefreshToken.mockRejectedValue(new Error("Invalid JWT"));

    await expect(createService().refresh(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.findSessionById).not.toHaveBeenCalled();
    expect(repositoryMock.rotateSessionToken).not.toHaveBeenCalled();
  });

  it("rejects when the refresh token user does not own the session", async () => {
    mocks.verifyRefreshToken.mockResolvedValue({
      user_id: "another-user-id",
      session_id: session.id,
    });

    await expect(createService().refresh(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.rotateSessionToken).not.toHaveBeenCalled();
  });
});

describe("AuthService logout", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    repositoryMock.findSessionById.mockResolvedValue({
      ...session,
    });

    mocks.verifyRefreshToken.mockResolvedValue({
      user_id: user.id,
      session_id: session.id,
    });

    mocks.verifyPassword.mockResolvedValue(true);

    repositoryMock.revokeSessionIfCurrent.mockResolvedValue({
      count: 1,
    });
  });

  it("revokes the session when the current refresh token is valid", async () => {
    const result = await createService().logout(refreshToken);

    expect(result).toEqual({ revoked: true });

    expect(repositoryMock.revokeSessionIfCurrent).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: session.id,
        current_refresh_token_hash: currentRefreshTokenHash,
        now: expect.any(Date),
      }),
    );
  });

  it("rejects an invalid refresh JWT", async () => {
    mocks.verifyRefreshToken.mockRejectedValue(new Error("Invalid JWT"));

    await expect(createService().logout(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.revokeSessionIfCurrent).not.toHaveBeenCalled();
  });

  it("rejects a token whose user does not own the session", async () => {
    mocks.verifyRefreshToken.mockResolvedValue({
      user_id: "another-user-id",
      session_id: session.id,
    });

    await expect(createService().logout(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.revokeSessionIfCurrent).not.toHaveBeenCalled();
  });

  it("rejects a refresh token that does not match the stored hash", async () => {
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(createService().logout(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.revokeSessionIfCurrent).not.toHaveBeenCalled();
  });

  it("rejects when conditional revocation fails", async () => {
    repositoryMock.revokeSessionIfCurrent.mockResolvedValue({
      count: 0,
    });

    await expect(createService().logout(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );
  });

  it("rejects when the session does not exist", async () => {
    repositoryMock.findSessionById.mockResolvedValue(null);

    await expect(createService().logout(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.revokeSessionIfCurrent).not.toHaveBeenCalled();
  });

  it("rejects an already revoked session", async () => {
    repositoryMock.findSessionById.mockResolvedValue({
      ...session,
      revoked_at: new Date(),
    });

    await expect(createService().logout(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.revokeSessionIfCurrent).not.toHaveBeenCalled();
  });

  it("rejects an expired session", async () => {
    repositoryMock.findSessionById.mockResolvedValue({
      ...session,
      expires_at: new Date(Date.now() - 60_000),
    });

    await expect(createService().logout(refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedAccessError,
    );

    expect(repositoryMock.revokeSessionIfCurrent).not.toHaveBeenCalled();
  });
});
