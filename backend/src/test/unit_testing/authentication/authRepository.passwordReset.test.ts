import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, transactionClient } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
  },
  transactionClient: {
    passwordResetToken: {
      updateMany: vi.fn(),
    },
    userCredential: {
      update: vi.fn(),
    },
    userSession: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("../../../config/database.js", () => ({
  prisma: prismaMock,
}));

import { AuthRepository } from "../../../modules/authentication/authRepository.js";

const input = {
  token_id: "reset-token-id",
  user_id: "user-id",
  password_hash: "new-password-hash",
  now: new Date("2026-10-13T00:00:00.000Z"),
};

describe("AuthRepository.completePasswordReset transaction", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    transactionClient.passwordResetToken.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 });

    transactionClient.userCredential.update.mockResolvedValue({
      user_id: input.user_id,
      password_hash: input.password_hash,
    });

    transactionClient.userSession.updateMany.mockResolvedValue({
      count: 3,
    });

    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    );
  });

  it("claims the token, updates the password, invalidates other tokens, and revokes sessions", async () => {
    const repository = new AuthRepository();

    const result = await repository.completePasswordReset(input);

    expect(result).toBe(true);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    expect(
      transactionClient.passwordResetToken.updateMany,
    ).toHaveBeenNthCalledWith(1, {
      where: {
        id: input.token_id,
        user_id: input.user_id,
        used_at: null,
        expires_at: {
          gt: input.now,
        },
      },
      data: {
        used_at: input.now,
      },
    });

    expect(transactionClient.userCredential.update).toHaveBeenCalledWith({
      where: {
        user_id: input.user_id,
      },
      data: {
        password_hash: input.password_hash,
      },
    });

    expect(
      transactionClient.passwordResetToken.updateMany,
    ).toHaveBeenNthCalledWith(2, {
      where: {
        user_id: input.user_id,
        used_at: null,
      },
      data: {
        used_at: input.now,
      },
    });

    expect(transactionClient.userSession.updateMany).toHaveBeenCalledWith({
      where: {
        user_id: input.user_id,
        revoked_at: null,
      },
      data: {
        revoked_at: input.now,
      },
    });

    expect(
      transactionClient.passwordResetToken.updateMany.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      transactionClient.userCredential.update.mock.invocationCallOrder[0]!,
    );

    expect(
      transactionClient.userCredential.update.mock.invocationCallOrder[0],
    ).toBeLessThan(
      transactionClient.userSession.updateMany.mock.invocationCallOrder[0]!,
    );
  });

  it("does not update the password or revoke sessions when the token cannot be claimed", async () => {
    transactionClient.passwordResetToken.updateMany.mockReset();
    transactionClient.passwordResetToken.updateMany.mockResolvedValue({
      count: 0,
    });

    const repository = new AuthRepository();

    const result = await repository.completePasswordReset(input);

    expect(result).toBe(false);

    expect(
      transactionClient.passwordResetToken.updateMany,
    ).toHaveBeenCalledTimes(1);

    expect(transactionClient.userCredential.update).not.toHaveBeenCalled();
    expect(transactionClient.userSession.updateMany).not.toHaveBeenCalled();
  });

  it("propagates password-update failures from the transaction", async () => {
    const repository = new AuthRepository();
    const databaseError = new Error("Password update failed");

    transactionClient.userCredential.update.mockRejectedValue(databaseError);

    await expect(repository.completePasswordReset(input)).rejects.toBe(
      databaseError,
    );

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(
      transactionClient.passwordResetToken.updateMany,
    ).toHaveBeenCalledTimes(1);
    expect(transactionClient.userCredential.update).toHaveBeenCalledTimes(1);

    // Execution stops after the failed password update.
    expect(
      transactionClient.passwordResetToken.updateMany,
    ).toHaveBeenCalledTimes(1);
    expect(transactionClient.userSession.updateMany).not.toHaveBeenCalled();
  });

  it("propagates session-revocation failures from the transaction", async () => {
    const repository = new AuthRepository();
    const databaseError = new Error("Session revocation failed");

    transactionClient.userSession.updateMany.mockRejectedValue(databaseError);

    await expect(repository.completePasswordReset(input)).rejects.toBe(
      databaseError,
    );

    expect(transactionClient.userCredential.update).toHaveBeenCalledTimes(1);
    expect(
      transactionClient.passwordResetToken.updateMany,
    ).toHaveBeenCalledTimes(2);
    expect(transactionClient.userSession.updateMany).toHaveBeenCalledTimes(1);
  });
});
