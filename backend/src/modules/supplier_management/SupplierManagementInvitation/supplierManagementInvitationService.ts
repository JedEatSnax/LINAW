import type { AppEnv } from "../../../config/env";
import type { Email } from "./supplierManagementInvitationValidator";
import { SupplierManagementInvitationRepository } from "./supplierManagementInvitationRepository";
import { EmailService } from "../../../shared/email/email.service";
import { MailgunEmailProvider } from "../../../shared/email/mailgun.provider";
import {
  AppError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from "../../../shared/errors/";

interface CreateInvitationContext {
  user_id: string;
  tenant_id: string;
  company_id: string;
  email: Email;
}

interface GeneralContext {
  user_id: string;
  tenant_id: string;
  company_id: string;
  status?: string;
  email?: string;
  page: number;
  limit: number;
}

interface InvitationContext {
  user_id: string;
  tenant_id: string;
  company_id: string;
  invitation_id: string;
}

interface AcceptInvitationContext {
  user_id: string;
  tenant_id: string;
  company_id?: string;
  token: string;
}

interface InvitationRecord {
  id: string;
  email: string;
  status: string;
  expires_at: Date | null;
  accepted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class SupplierManagementInvitationService {
  constructor(private repository: SupplierManagementInvitationRepository) {}

  private generateInvitationToken(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));

    return Array.from(randomBytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  private invitationUrl(env: AppEnv, token: string) {
    const invitationUrl = new URL("/invitations/accept", env.APP_URL);

    invitationUrl.searchParams.set("token", token);

    return invitationUrl.toString();
  }

  private async hashInvitationToken(token: string): Promise<string> {
    const encodedToken = new TextEncoder().encode(token);

    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedToken);

    return Array.from(new Uint8Array(hashBuffer), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  private readonly INVITATION_LIFETIME_MS = 72 * 60 * 60 * 1000;

  private createInvitationExpiration(): Date {
    return new Date(Date.now() + this.INVITATION_LIFETIME_MS);
  }

  private toInvitationResponse(invitation: InvitationRecord) {
    return {
      invitation_id: invitation.id,
      email: invitation.email,
      invitation_status: invitation.status,
      expires_at: invitation.expires_at,
      accepted_at: invitation.accepted_at,
      created_at: invitation.created_at,
      updated_at: invitation.updated_at,
    };
  }

  async createInvitation(input: CreateInvitationContext) {
    const invitation = await this.repository.createInvitation({
      user_id: input.user_id,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      email: input.email,
    });

    return invitation;
  }

  async getInvitations(input: GeneralContext) {
    const result = await this.repository.getInvitations({
      user_id: input.user_id,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      status: input.status,
      email: input.email,
      page: input.page,
      limit: input.limit,
    });

    return {
      invitations: result.invitations.map((invitation) =>
        this.toInvitationResponse(invitation),
      ),
      pagination: {
        page: input.page,
        limit: input.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / input.limit),
      },
    };
  }

  async getInvitation(input: InvitationContext) {
    const invitation = await this.repository.getInvitation({
      user_id: input.user_id,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      invitation_id: input.invitation_id,
    });

    if (!invitation) {
      throw new NotFoundError("Supplier invitation not found.");
    }

    return this.toInvitationResponse(invitation);
  }

  async sendInvitation(input: InvitationContext, env: AppEnv) {
    const invitation = await this.repository.getInvitation({
      user_id: input.user_id,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      invitation_id: input.invitation_id,
    });

    if (!invitation) {
      throw new NotFoundError("Supplier invitation not found.");
    }

    if (
      invitation.status !== "DRAFT" &&
      !(
        invitation.status === "PENDING" &&
        invitation.expires_at !== null &&
        invitation.expires_at.getTime() <= Date.now()
      )
    ) {
      throw new ConflictError("This invitation cannot be sent again.");
    }

    const token = this.generateInvitationToken();
    const tokenHash = await this.hashInvitationToken(token);
    const expiresAt = this.createInvitationExpiration();
    const url = this.invitationUrl(env, token);

    // Repository operation to prepare the invitation for sending.
    const prepared = await this.repository.prepareInvitationForSending({
      invitation_id: input.invitation_id,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (!prepared) {
      throw new ConflictError(
        "The invitation could not be prepared for sending.",
      );
    }

    const provider = new MailgunEmailProvider(env);
    const emailService = new EmailService(provider);

    try {
      await emailService.send({
        to: invitation.email,
        subject: "You're Invited to Join LINAW as a Supplier",
        text: [
          "Hello,",
          "",
          "You have been invited to join LINAW as a supplier.",
          "",
          "To review and accept this invitation, open the link below:",
          url,
          "",
          "This invitation expires in 72 hours.",
          "",
          "If you weren't expecting this email, you can safely ignore it.",
          "",
          "Regards,",
          "LINAW Team",
        ].join("\n"),
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
                    <h2>You're Invited to Join LINAW</h2>

                    <p>Hello,</p>

                    <p>
                        You have been invited to join LINAW as a supplier.
                        Click the button below to review and accept your invitation.
                    </p>

                    <p style="margin: 32px 0;">
                        <a
                            href="${url}"
                            style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;"
                        >
                            Review Invitation
                        </a>
                    </p>

                    <p>This invitation expires in 72 hours.</p>

                    <p>
                        If you weren't expecting this invitation, you can safely ignore this email.
                    </p>

                    <p>Regards,<br />LINAW Team</p>
                </div>
                `,
      });
    } catch {
      await this.repository.resetInvitationToDraft({
        invitation_id: input.invitation_id,
        tenant_id: input.tenant_id,
        company_id: input.company_id,
      });
      throw new ServiceUnavailableError(
        "The invitation email could not be delivered.",
      );
    }

    // Repository operation to transition SENDING -> PENDING.
    const sent = await this.repository.markInvitationPending({
      invitation_id: input.invitation_id,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!sent) {
      throw new ServiceUnavailableError(
        "The email was submitted, but the invitation status could not be updated.",
      );
    }

    return {
      invitation_id: input.invitation_id,
      invitation_status: "PENDING",
      email: invitation.email,
      expires_at: expiresAt,
    };
  }

  async validateInvitation(input: { token: string }) {
    const tokenHash = await this.hashInvitationToken(input.token);

    const invitation = await this.repository.findInvitationByTokenHash({
      token_hash: tokenHash,
    });

    if (!invitation) {
      throw new NotFoundError("Supplier invitation not found.");
    }

    if (invitation.status !== "PENDING") {
      throw new ConflictError("This invitation is no longer valid.");
    }

    if (
      !invitation.expires_at ||
      invitation.expires_at.getTime() <= Date.now()
    ) {
      throw new AppError("Supplier invitation link expired.", 410, "GONE");
    }

    const existingUser = await this.repository.findUserByEmail({
      tenant_id: invitation.tenant_id,
      email: invitation.email,
    });

    return {
      invitation_id: invitation.id,
      invitation_status: invitation.status,
      expires_at: invitation.expires_at,
      onboarding_action: existingUser ? "EXISTING_COMPANY" : "REGISTER_COMPANY",
    };
  }

  async acceptInvitation(input: AcceptInvitationContext) {
    const tokenHash = await this.hashInvitationToken(input.token);

    // Revalidate the invitation on the server.
    // The frontend's earlier validation is not sufficient.
    const invitation = await this.repository.findInvitationByTokenHash({
      token_hash: tokenHash,
    });

    if (!invitation) {
      throw new NotFoundError("Supplier invitation not found.");
    }

    if (invitation.status !== "PENDING") {
      throw new ConflictError("This invitation is no longer valid.");
    }

    if (
      !invitation.expires_at ||
      invitation.expires_at.getTime() <= Date.now()
    ) {
      throw new AppError("Supplier invitation link expired.", 410, "GONE");
    }

    // Resolve the authenticated user and verify the invited email.
    const user = await this.repository.findAcceptingUser({
      user_id: input.user_id,
      tenant_id: input.tenant_id,
    });

    if (!user) {
      throw new NotFoundError("Authenticated user not found.");
    }

    const normalizedUserEmail = user.email.trim().toLowerCase();
    const normalizedInvitationEmail = invitation.email.trim().toLowerCase();

    if (normalizedUserEmail !== normalizedInvitationEmail) {
      throw new ConflictError(
        "The invitation email does not match your account email.",
      );
    }

    // Resolve the company the user is accepting on behalf of.
    const memberships = await this.repository.findActiveCompanyMemberships({
      user_id: input.user_id,
      tenant_id: input.tenant_id,
    });

    let acceptingCompanyId = input.company_id;

    if (!acceptingCompanyId && memberships.length === 1) {
      const membership = memberships[0];

      if (membership) {
        acceptingCompanyId = membership.company_id;
      }
    }

    if (memberships.length === 0) {
      throw new ConflictError(
        "Register or join a company before accepting this invitation.",
      );
    }

    if (!acceptingCompanyId) {
      throw new ConflictError(
        "Select the company that will accept this invitation.",
      );
    }

    const belongsToCompany = memberships.some(
      (membership) => membership.company_id === acceptingCompanyId,
    );

    if (!belongsToCompany) {
      throw new ConflictError(
        "You do not have an active membership in the selected company.",
      );
    }

    // The repository must perform the relationship changes and invitation
    // acceptance atomically, including a final status/expiry check.
    const acceptedAt = new Date();

    const result = await this.repository.acceptInvitation({
      invitation_id: invitation.id,
      token_hash: tokenHash,
      user_id: input.user_id,
      tenant_id: input.tenant_id,
      company_id: acceptingCompanyId,
      accepted_at: acceptedAt,
    });

    if (!result) {
      throw new ConflictError(
        "The invitation could not be accepted. It may have expired or already been accepted.",
      );
    }

    return {
      invitation_id: invitation.id,
      relationship_id: result.relationship_id,
      status: "ACCEPTED" as const,
      accepted_at: result.accepted_at,
    };
  }
}
