import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    userSession: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  userSessionMock: {
    create: vi.fn(),
  },
}));

vi.mock("../../../config/database.js", () => ({
  prisma: prismaMock,
}));

import { AuthRepository } from "../../../modules/authentication/authRepository.js";

describe("AuthRepository.createSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a session with its final refresh-token hash", async () => {
    const input = {
      id: "session-id",
      tenant_id: "tenant-id",
      user_id: "user-id",
      refresh_token_hash: "hashed-refresh-token",
      expires_at: new Date("2026-11-12T00:00:00.000Z"),
    };

    const createdSession = {
      ...input,
      revoked_at: null,
    };

    prismaMock.userSession.create.mockResolvedValue(createdSession);

    const repository = new AuthRepository();

    const result = await repository.createSession(input);

    expect(prismaMock.userSession.create).toHaveBeenCalledTimes(1);

    expect(prismaMock.userSession.create).toHaveBeenCalledWith({
      data: input,
    });

    expect(result).toEqual(createdSession);
  });

  it("propagates database failures", async () => {
    const databaseError = new Error("Session creation failed");

    prismaMock.userSession.create.mockRejectedValue(databaseError);

    const repository = new AuthRepository();

    await expect(
      repository.createSession({
        id: "session-id",
        tenant_id: "tenant-id",
        user_id: "user-id",
        refresh_token_hash: "hashed-refresh-token",
        expires_at: new Date("2026-11-12T00:00:00.000Z"),
      }),
    ).rejects.toBe(databaseError);
  });
});

describe("AuthRepository.revokeSessionIfCurrent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("conditionally revokes the current active session", async () => {
    const input = {
      session_id: "session-id",
      current_refresh_token_hash: "current-refresh-hash",
      now: new Date("2026-10-13T00:00:00.000Z"),
    };

    prismaMock.userSession.updateMany.mockResolvedValue({
      count: 1,
    });

    const repository = new AuthRepository();
    const result = await repository.revokeSessionIfCurrent(input);

    expect(prismaMock.userSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: input.session_id,
        refresh_token_hash: input.current_refresh_token_hash,
        revoked_at: null,
        expires_at: {
          gt: input.now,
        },
      },
      data: {
        revoked_at: input.now,
      },
    });

    expect(result).toEqual({ count: 1 });
  });

  it("reports when the session can no longer be revoked", async () => {
    const input = {
      session_id: "session-id",
      current_refresh_token_hash: "stale-refresh-hash",
      now: new Date("2026-10-13T00:00:00.000Z"),
    };

    prismaMock.userSession.updateMany.mockResolvedValue({
      count: 0,
    });

    const repository = new AuthRepository();
    const result = await repository.revokeSessionIfCurrent(input);

    expect(result).toEqual({ count: 0 });
  });
});
