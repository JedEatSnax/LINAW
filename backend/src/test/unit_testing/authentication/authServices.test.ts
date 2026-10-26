import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../modules/authentication/authPassword.js", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

import { AuthService } from "../../../modules/authentication/authServices.js";
import { AuthRepository } from "../../../modules/authentication/authRepository.js";
import { UnauthorizedAccessError } from "../../../shared/errors/appError.js";
import type { AppEnv } from "../../../config/env.js";
import type { AuthNotifier } from "../../../modules/authentication/authNotifications.js";
import {
  hashPassword,
  verifyPassword,
} from "../../../modules/authentication/authPassword.js";

const repositoryMock = {
  findUserWithCredentialsByEmail: vi.fn(),
  createPasswordResetToken: vi.fn(),
  findPasswordResetTokenById: vi.fn(),
  findUserWithCredentialsById: vi.fn(),
  completePasswordReset: vi.fn(),
};

const notifierMock = {
  sendPasswordResetEmail: vi.fn(),
};

const env = {
  APP_URL: "https://linaw.example",
} as AppEnv;

function createService() {
  return new AuthService(
    repositoryMock as unknown as AuthRepository,
    env,
    notifierMock as unknown as AuthNotifier,
  );
}

const user = {
  id: "user-id",
  tenant_id: "tenant-id",
  email: "user@example.com",
  credentials: {
    password_hash: "existing-password-hash",
  },
};

describe("AuthService password reset", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(hashPassword).mockResolvedValue("hashed-value");
    vi.mocked(verifyPassword).mockResolvedValue(true);

    repositoryMock.findUserWithCredentialsByEmail.mockResolvedValue(user);
    repositoryMock.createPasswordResetToken.mockResolvedValue({});
    repositoryMock.findPasswordResetTokenById.mockResolvedValue(null);
    repositoryMock.findUserWithCredentialsById.mockResolvedValue(user);
    repositoryMock.completePasswordReset.mockResolvedValue(true);
    notifierMock.sendPasswordResetEmail.mockResolvedValue(undefined);
  });

  describe("requestPasswordReset", () => {
    it("returns success without sending email when the account does not exist", async () => {
      repositoryMock.findUserWithCredentialsByEmail.mockResolvedValue(null);

      const result = await createService().requestPasswordReset({
        email: "unknown@example.com",
      });

      expect(result).toEqual({ success: true });
      expect(repositoryMock.createPasswordResetToken).not.toHaveBeenCalled();
      expect(notifierMock.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("creates a hashed reset token and sends the reset link", async () => {
      const result = await createService().requestPasswordReset({
        email: user.email,
      });

      expect(result).toEqual({ success: true });

      expect(repositoryMock.createPasswordResetToken).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          tenant_id: user.tenant_id,
          user_id: user.id,
          token_hash: "hashed-value",
          expires_at: expect.any(Date),
        }),
      );

      expect(hashPassword).toHaveBeenCalledTimes(1);

      const emailCall = notifierMock.sendPasswordResetEmail.mock.calls[0]![0];

      expect(emailCall.email).toBe(user.email);

      const resetUrl = new URL(emailCall.resetLink);

      expect(resetUrl.origin).toBe("https://linaw.example");
      expect(resetUrl.pathname).toBe("/reset-password");
      expect(resetUrl.searchParams.get("token")).toMatch(/^[^.]+\.[^.]+$/);
    });
  });

  describe("resetPassword", () => {
    const resetInput = {
      user_id: user.id,
      resetToken: "reset-token-id.reset-token-secret",
      password: "new-secure-password-123",
      confirmPassword: "new-secure-password-123",
    };

    const tokenRecord = {
      id: "reset-token-id",
      tenant_id: user.tenant_id,
      user_id: user.id,
      token_hash: "stored-token-hash",
      expires_at: new Date(Date.now() + 60_000),
      used_at: null,
    };

    it("rejects a malformed reset token", async () => {
      await expect(
        createService().resetPassword({
          ...resetInput,
          resetToken: "malformed-token",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedAccessError);

      expect(repositoryMock.findPasswordResetTokenById).not.toHaveBeenCalled();
      expect(repositoryMock.completePasswordReset).not.toHaveBeenCalled();
    });

    it("rejects a token that cannot be found", async () => {
      repositoryMock.findPasswordResetTokenById.mockResolvedValue(null);

      await expect(
        createService().resetPassword(resetInput),
      ).rejects.toBeInstanceOf(UnauthorizedAccessError);

      expect(repositoryMock.completePasswordReset).not.toHaveBeenCalled();
    });

    it("rejects an expired reset token", async () => {
      repositoryMock.findPasswordResetTokenById.mockResolvedValue({
        ...tokenRecord,
        expires_at: new Date(Date.now() - 60_000),
      });

      await expect(
        createService().resetPassword(resetInput),
      ).rejects.toBeInstanceOf(UnauthorizedAccessError);

      expect(verifyPassword).not.toHaveBeenCalled();
      expect(repositoryMock.completePasswordReset).not.toHaveBeenCalled();
    });

    it("rejects a reset token that has already been used", async () => {
      repositoryMock.findPasswordResetTokenById.mockResolvedValue({
        ...tokenRecord,
        used_at: new Date(),
      });

      await expect(
        createService().resetPassword(resetInput),
      ).rejects.toBeInstanceOf(UnauthorizedAccessError);

      expect(repositoryMock.completePasswordReset).not.toHaveBeenCalled();
    });

    it("rejects an incorrect reset-token secret", async () => {
      repositoryMock.findPasswordResetTokenById.mockResolvedValue(tokenRecord);
      vi.mocked(verifyPassword).mockResolvedValue(false);

      await expect(
        createService().resetPassword(resetInput),
      ).rejects.toBeInstanceOf(UnauthorizedAccessError);

      expect(repositoryMock.completePasswordReset).not.toHaveBeenCalled();
    });

    it("completes the reset through the repository's atomic operation", async () => {
      repositoryMock.findPasswordResetTokenById.mockResolvedValue(tokenRecord);

      const result = await createService().resetPassword(resetInput);

      expect(result).toEqual({ success: true });

      expect(verifyPassword).toHaveBeenCalledWith(
        tokenRecord.token_hash,
        "reset-token-secret",
      );

      expect(hashPassword).toHaveBeenCalledWith(resetInput.password);

      expect(repositoryMock.completePasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          token_id: tokenRecord.id,
          user_id: user.id,
          password_hash: "hashed-value",
          now: expect.any(Date),
        }),
      );
    });

    it("rejects when the atomic reset operation cannot claim the token", async () => {
      repositoryMock.findPasswordResetTokenById.mockResolvedValue(tokenRecord);
      repositoryMock.completePasswordReset.mockResolvedValue(false);

      await expect(
        createService().resetPassword(resetInput),
      ).rejects.toBeInstanceOf(UnauthorizedAccessError);
    });
  });
});
