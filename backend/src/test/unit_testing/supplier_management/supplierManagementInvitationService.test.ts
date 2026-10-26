import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../../../config/env.js";
import { SupplierManagementInvitationService } from "../../../modules/supplier_management/SupplierManagementInvitation/supplierManagementInvitationService.js";
import type { SupplierManagementInvitationRepository } from "../../../modules/supplier_management/SupplierManagementInvitation/supplierManagementInvitationRepository.js";
import { MailgunEmailProvider } from "../../../shared/email/mailgun.provider.js";

vi.mock("../../../shared/email/mailgun.provider.js", () => ({
  MailgunEmailProvider: vi.fn(function (this: { send: ReturnType<typeof vi.fn> }) {
    this.send = vi.fn();
  }),
}));

const repositoryMock = {
  getInvitation: vi.fn(),
  prepareInvitationForSending: vi.fn(),
  markInvitationPending: vi.fn(),
  resetInvitationToDraft: vi.fn(),
};

const env = {
  APP_URL: "https://frontend.example.test/",
  ALLOWED_ORIGIN: "http://localhost:5173",
} as AppEnv;

const invitation = {
  id: "invitation-id",
  email: "supplier@example.test",
  status: "DRAFT",
  expires_at: null,
};

describe("SupplierManagementInvitationService invitation links", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    repositoryMock.getInvitation.mockResolvedValue(invitation);
    repositoryMock.prepareInvitationForSending.mockResolvedValue(true);
    repositoryMock.markInvitationPending.mockResolvedValue(true);
  });

  it("sends an invitation link using APP_URL with the raw token", async () => {
    const service = new SupplierManagementInvitationService(
      repositoryMock as unknown as SupplierManagementInvitationRepository,
    );

    await service.sendInvitation(
      {
        user_id: "user-id",
        tenant_id: "tenant-id",
        company_id: "company-id",
        invitation_id: invitation.id,
      },
      env,
    );

    const provider = vi.mocked(MailgunEmailProvider).mock.results[0]?.value as {
      send: ReturnType<typeof vi.fn>;
    };
    const email = provider.send.mock.calls[0]?.[0] as {
      text: string;
      html: string;
    };
    const invitationLink = email.text
      .split("\n")
      .find((line) => line.startsWith("https://"));
    const invitationUrl = new URL(invitationLink ?? "");

    expect(invitationUrl.origin).toBe("https://frontend.example.test");
    expect(invitationUrl.pathname).toBe("/invitations/accept");
    expect(invitationUrl.searchParams.get("token")).toMatch(/^[0-9a-f]{64}$/);
    expect(email.html).toContain(invitationUrl.toString());
    expect(invitationUrl.origin).not.toBe(new URL(env.ALLOWED_ORIGIN).origin);
  });
});