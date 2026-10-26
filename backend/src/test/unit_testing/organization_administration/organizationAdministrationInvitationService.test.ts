import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, InvalidTokenError } from "../../../shared/errors/appError.js";
import { OrganizationAdministrationService } from "../../../modules/organization_administration/organizationAdministrationService.js";
import type { OrganizationAdministrationRepository } from "../../../modules/organization_administration/organizationAdministrationRepository.js";
import type { AppEnv } from "../../../config/env.js";

const repositoryMock = {
  findCompanyMemberByEmail: vi.fn(),
  findInvitationByEmail: vi.fn(),
  createInvitation: vi.fn(),
  markInvitationStatus: vi.fn(),
  findInvitationByTokenHash: vi.fn(),
  findUserIdentity: vi.fn(),
  acceptInvitation: vi.fn(),
};

const input = {
  user_id: "admin-id",
  tenant_id: "tenant-id",
  company_id: "company-id",
  email: "new.user@example.com",
};

const env = {
  APP_URL: "https://linaw.example",
  MAILGUN_FROM: "LINAW <noreply@linaw.example>",
  MAILGUN_DOMAIN: "linaw.example",
  MAILGUN_API_KEY: "test-key",
} as unknown as AppEnv;

function createService() {
  return new OrganizationAdministrationService(
    repositoryMock as unknown as OrganizationAdministrationRepository,
  );
}

describe("Organization member invitation lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    repositoryMock.findCompanyMemberByEmail.mockResolvedValue(null);
    repositoryMock.findInvitationByEmail.mockResolvedValue(null);
    repositoryMock.createInvitation.mockResolvedValue({ id: "invitation-id" });
    repositoryMock.markInvitationStatus.mockResolvedValue(undefined);
  });

  it("creates and delivers an invitation without an existing user account", async () => {
    await expect(createService().addMember(input, env)).resolves.toEqual({
      success: true,
    });

    expect(repositoryMock.createInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: input.tenant_id,
        company_id: input.company_id,
        email: input.email,
        status: "SENDING",
        expires_at: expect.any(Date),
      }),
    );
    expect(repositoryMock.markInvitationStatus).toHaveBeenCalledWith({
      id: "invitation-id",
      status: "PENDING",
    });
  });

  it("rejects a second pending invitation for the same company email", async () => {
    repositoryMock.findInvitationByEmail.mockResolvedValue({ id: "existing" });

    await expect(createService().addMember(input, env)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(repositoryMock.createInvitation).not.toHaveBeenCalled();
  });

  it("accepts only a repository-approved tenant-scoped invitation", async () => {
    repositoryMock.acceptInvitation.mockResolvedValue({ status: "accepted" });

    await expect(
      createService().acceptInvitation({
        user_id: "user-id",
        tenant_id: "tenant-id",
        email: input.email,
        token: "a".repeat(64),
      }),
    ).resolves.toEqual({ success: true });

    expect(repositoryMock.acceptInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-id",
        tenant_id: "tenant-id",
        email: input.email,
        token_hash: expect.any(String),
      }),
    );
  });

  it("rejects an invitation that the repository cannot claim", async () => {
    repositoryMock.acceptInvitation.mockResolvedValue({ status: "invalid" });

    await expect(
      createService().acceptInvitation({
        user_id: "user-id",
        tenant_id: "tenant-id",
        email: input.email,
        token: "b".repeat(64),
      }),
    ).rejects.toBeInstanceOf(InvalidTokenError);
  });
});
