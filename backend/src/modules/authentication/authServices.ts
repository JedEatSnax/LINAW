import { AuthRepository } from "./authRepository.js";
import { hashPassword, verifyPassword } from "./authPassword.js";
import type {
  forgotPasswordInput,
  loginInput,
  resetPasswordInput,
  signupInput,
  findById,
} from "./authValidator.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedAccessError,
} from "../../shared/errors/appError.js";
import { randomBytes, randomUUID } from "node:crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "./authJWT.js";
import type { RefreshTokenPayload } from "./authJWT.js";
import type { AppEnv } from "../../config/env.js";
import { resolveAppUrl } from "../../config/env.js";
import type { AuthNotifier } from "./authNotifications.js";
import { NoopAuthNotifier } from "./authNotifications.js";
import { hashToken } from "../../shared/types/cryptoUtility.js";

export class AuthService {
  constructor(
    private repository: AuthRepository,
    private env: AppEnv,
    private notifier: AuthNotifier = new NoopAuthNotifier(),
  ) {}

  private async resolveCompanyMembership(
    user_id: string,
    tenant_id: string,
  ): Promise<string | undefined> {
    const memberships = await this.repository.findActiveCompanyMemberships({
      user_id,
      tenant_id,
    });

    if (memberships.length === 0) {
      return undefined;
    }

    if (memberships.length > 1) {
      throw new UnauthorizedAccessError(
        "Multiple active company memberships found; company selection is required",
      );
    }

    return memberships[0]!.company_id;
  }

  async register(data: signupInput) {
    const existingEmail = await this.repository.findUserWithCredentialsByEmail(
      data.email,
    );

    if (existingEmail) {
      throw new ConflictError("This email address is already registered.");
    }

    const password_hash = await hashPassword(data.password);
    if (data.invitation_token) {
      const result = await this.repository.registerUserForInvitation({
        token_hash: await hashToken(data.invitation_token),
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password_hash,
      });
      if (result.status === "invalid") {
        throw new UnauthorizedAccessError("Invalid or expired invitation");
      }
    } else {
      const tenant_id = randomUUID();
      await this.repository.registerUser({
        tenant_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password_hash,
      });
    }

    return this.login({
      email: data.email,
      password: data.password,
    });
  }

  async login(data: loginInput) {
    const user = await this.repository.findUserWithCredentialsByEmail(
      data.email,
    );

    // Use the same error for an unknown account and invalid credentials.
    if (!user || !user.credentials) {
      throw new UnauthorizedAccessError("Invalid email or password");
    }

    // Do not authenticate inactive accounts.
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedAccessError("Invalid email or password");
    }

    const isValid = await verifyPassword(
      user.credentials.password_hash,
      data.password,
    );

    if (!isValid) {
      throw new UnauthorizedAccessError("Invalid email or password");
    }

    const company_id = await this.resolveCompanyMembership(
      user.id,
      user.tenant_id,
    );

    const sessionId = randomUUID();

    // Preserve the existing 30-day session lifetime for now.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Generate the final tokens before persisting the session.
    const refreshToken = await generateRefreshToken(
      {
        user_id: user.id,
        session_id: sessionId,
      },
      this.env,
    );

    const refreshTokenHash = await hashPassword(refreshToken);

    const accessToken = await generateAccessToken(
      {
        user_id: user.id,
        session_id: sessionId,
        tenant_id: user.tenant_id,
        ...(company_id ? { company_id } : {}),
      },
      this.env,
    );

    // Create the session once, with the final refresh-token hash.
    await this.repository.createSession({
      id: sessionId,
      tenant_id: user.tenant_id,
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      expires_at: expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async findId(user: findById, requesterUserId: string) {
    const { id } = user;

    if (id !== requesterUserId) {
      throw new UnauthorizedAccessError("Cannot access another user's data");
    }

    const checkUser = await this.repository.findUserById(id);

    if (!checkUser) {
      throw new NotFoundError("User not found");
    }

    return {
      checkUser,
    };
  }

  async logout(refreshToken: string) {
    let payload: RefreshTokenPayload;

    try {
      payload = await verifyRefreshToken(refreshToken, this.env);
    } catch {
      throw new UnauthorizedAccessError("Invalid refresh token");
    }

    const session = await this.repository.findSessionById(payload.session_id);

    if (
      !session ||
      session.user_id !== payload.user_id ||
      session.revoked_at ||
      session.expires_at <= new Date()
    ) {
      throw new UnauthorizedAccessError("Invalid refresh token");
    }

    const isValid = await verifyPassword(
      session.refresh_token_hash,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedAccessError("Invalid refresh token");
    }

    const now = new Date();

    const result = await this.repository.revokeSessionIfCurrent({
      session_id: session.id,
      current_refresh_token_hash: session.refresh_token_hash,
      now,
    });

    if (result.count !== 1) {
      throw new UnauthorizedAccessError("Refresh token is no longer valid");
    }

    return {
      revoked: true,
    };
  }

  async refresh(refreshToken: string) {
    let payload: RefreshTokenPayload;

    try {
      payload = await verifyRefreshToken(refreshToken, this.env);
    } catch {
      throw new UnauthorizedAccessError("Invalid refresh token");
    }

    const session = await this.repository.findSessionById(payload.session_id);

    if (!session) {
      throw new UnauthorizedAccessError("Session does not exist");
    }

    if (session.user_id !== payload.user_id) {
      throw new UnauthorizedAccessError("Invalid refresh token");
    }

    const user = await this.repository.findUserById(session.user_id);

    if (!user) {
      throw new UnauthorizedAccessError("User does not exist");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedAccessError("Invalid refresh token");
    }

    if (session.revoked_at) {
      throw new UnauthorizedAccessError("Session has been revoked");
    }

    if (session.expires_at <= new Date()) {
      throw new UnauthorizedAccessError("Session expired");
    }

    const isValid = await verifyPassword(
      session.refresh_token_hash,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedAccessError("Invalid refresh token");
    }

    const company_id = await this.resolveCompanyMembership(
      user.id,
      user.tenant_id,
    );

    const newAccessToken = await generateAccessToken(
      {
        user_id: user.id,
        session_id: session.id,
        tenant_id: user.tenant_id,
        ...(company_id ? { company_id } : {}),
      },
      this.env,
    );

    const newRefreshToken = await generateRefreshToken(
      {
        user_id: user.id,
        session_id: session.id,
      },
      this.env,
    );

    const newRefreshTokenHash = await hashPassword(newRefreshToken);

    const rotationResult = await this.repository.rotateSessionToken({
      session_id: session.id,
      current_refresh_token_hash: session.refresh_token_hash,
      new_refresh_token_hash: newRefreshTokenHash,
      now: new Date(),
    });

    if (rotationResult.count !== 1) {
      throw new UnauthorizedAccessError("Refresh token is no longer valid");
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async requestPasswordReset(data: forgotPasswordInput) {
    const user = await this.repository.findUserWithCredentialsByEmail(
      data.email,
    );

    if (!user) {
      return {
        success: true,
      };
    }

    const tokenId = randomUUID();
    const tokenSecret = randomBytes(32).toString("base64url");
    const resetToken = `${tokenId}.${tokenSecret}`;
    const tokenHash = await hashPassword(tokenSecret);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.repository.createPasswordResetToken({
      id: tokenId,
      tenant_id: user.tenant_id,
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const resetUrl = new URL(
      "/reset-password",
      resolveAppUrl(this.env.APP_URL),
    );
    resetUrl.searchParams.set("token", resetToken);

    await this.notifier.sendPasswordResetEmail({
      email: user.email,
      resetLink: resetUrl.toString(),
    });

    return {
      success: true,
    };
  }

  async resetPassword(data: resetPasswordInput) {
    const [tokenId, tokenSecret] = data.resetToken.split(".");

    if (!tokenId || !tokenSecret) {
      throw new UnauthorizedAccessError("Invalid reset token");
    }

    const tokenRecord =
      await this.repository.findPasswordResetTokenById(tokenId);

    if (!tokenRecord) {
      throw new UnauthorizedAccessError("Invalid reset token");
    }

    if (tokenRecord.used_at) {
      throw new UnauthorizedAccessError("Reset token already used");
    }

    if (tokenRecord.expires_at <= new Date()) {
      throw new UnauthorizedAccessError("Reset token expired");
    }

    const isValid = await verifyPassword(tokenRecord.token_hash, tokenSecret);

    if (!isValid) {
      throw new UnauthorizedAccessError("Invalid reset token");
    }

    const user = await this.repository.findUserWithCredentialsById(
      tokenRecord.user_id,
    );

    if (!user || !user.credentials) {
      throw new NotFoundError("User not found");
    }

    const passwordHash = await hashPassword(data.password);

    const now = new Date();

    const completed = await this.repository.completePasswordReset({
      token_id: tokenRecord.id,
      user_id: user.id,
      password_hash: passwordHash,
      now,
    });

    if (!completed) {
      throw new UnauthorizedAccessError("Invalid or expired reset token");
    }

    return {
      success: true,
    };
  }
}
