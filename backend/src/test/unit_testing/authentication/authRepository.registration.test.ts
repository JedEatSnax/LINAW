import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, transactionClient } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
  },
  transactionClient: {
    tenant: {
      create: vi.fn(),
    },
    user: {
      create: vi.fn(),
    },
    userCredential: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../../config/database.js", () => ({
  prisma: prismaMock,
}));

import { AuthRepository } from "../../../modules/authentication/authRepository.js";

const registrationInput = {
  tenant_id: "tenant-id",
  first_name: "Test",
  last_name: "Account",
  email: "test@example.com",
  password_hash: "hashed-password",
};

describe("AuthRepository.registerUser transaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    transactionClient.tenant.create.mockResolvedValue({
      id: registrationInput.tenant_id,
    });

    transactionClient.user.create.mockResolvedValue({
      id: "user-id",
      tenant_id: registrationInput.tenant_id,
      email: registrationInput.email,
    });

    transactionClient.userCredential.create.mockResolvedValue({
      user_id: "user-id",
      password_hash: registrationInput.password_hash,
    });

    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    );
  });

  it("creates the tenant, user, and credentials in one transaction", async () => {
    const repository = new AuthRepository();

    const result = await repository.registerUser(registrationInput);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    expect(transactionClient.tenant.create).toHaveBeenCalledWith({
      data: {
        id: registrationInput.tenant_id,
        status: "ACTIVE",
        plan: "FREE",
      },
    });

    expect(transactionClient.user.create).toHaveBeenCalledWith({
      data: {
        tenant_id: registrationInput.tenant_id,
        first_name: registrationInput.first_name,
        last_name: registrationInput.last_name,
        email: registrationInput.email,
        status: "ACTIVE",
      },
    });

    expect(transactionClient.userCredential.create).toHaveBeenCalledWith({
      data: {
        user_id: "user-id",
        password_hash: registrationInput.password_hash,
      },
    });

    expect(
      transactionClient.tenant.create.mock.invocationCallOrder[0],
    ).toBeLessThan(transactionClient.user.create.mock.invocationCallOrder[0]!);

    expect(
      transactionClient.user.create.mock.invocationCallOrder[0],
    ).toBeLessThan(
      transactionClient.userCredential.create.mock.invocationCallOrder[0]!,
    );

    expect(result).toEqual({
      id: "user-id",
      tenant_id: registrationInput.tenant_id,
      email: registrationInput.email,
    });
  });

  it("propagates credential creation failures from the transaction", async () => {
    const repository = new AuthRepository();
    const databaseError = new Error("Credential creation failed");

    transactionClient.userCredential.create.mockRejectedValue(databaseError);

    await expect(repository.registerUser(registrationInput)).rejects.toBe(
      databaseError,
    );

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(transactionClient.tenant.create).toHaveBeenCalledTimes(1);
    expect(transactionClient.user.create).toHaveBeenCalledTimes(1);
    expect(transactionClient.userCredential.create).toHaveBeenCalledTimes(1);
  });
});
