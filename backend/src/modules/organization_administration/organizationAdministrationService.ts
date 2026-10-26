import { EmailService } from "../../shared/email/email.service";
import {
  ConflictError,
  InvalidTokenError,
  NotFoundError,
  ServiceUnavailableError,
} from "../../shared/errors/appError.js";
import { hashToken } from "../../shared/types/cryptoUtility";
import type {
  updateSettings,
  memberEmail,
  updateMember,
  createRole,
  assignRole,
  assignPermissions,
  updateRole,
  removePermission,
} from "./organizationAdministrationValidator";
import type { AppEnv } from "../../config/env";
import type {
  AssignRoleContext,
  CreateRoleContext,
  OrganizationAdministrationRepository,
} from "./organizationAdministrationRepository";
import { MailgunEmailProvider } from "../../shared/email/mailgun.provider";

interface InviteMemberInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  email: memberEmail;
}

interface AcceptInvitationInput {
  user_id: string;
  tenant_id: string;
  email: string;
  token: string;
}

interface GetInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
}

interface GetUserInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  target_user_id: string;
}

interface RoleInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  role: createRole;
}

interface AssignRoleInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  member_user_id: string;
  assignRole: assignRole;
}

interface UpdateMemberInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  target_user_id: string;
  update: updateMember;
}

interface AssignPermissionsInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  role_id: string;
  permissions: assignPermissions;
}

interface GetRolesInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  role_id: string;
}

interface UpdateRoleInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  role_id: string;
  update: updateRole;
}

interface deletePermissionsFromRoleInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  role_id: string;
  permission_id: removePermission["permission_id"];
}

interface UpdateSettingsInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  updateSettings: updateSettings;
}

interface RemoveRoleFromMemberInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  member_user_id: string;
  role_id: string;
}

export class OrganizationAdministrationService {
  constructor(private repository: OrganizationAdministrationRepository) {}

  async addMember(input: InviteMemberInput, env: AppEnv) {
    /*
            1. Check target membership

            2. Find target user

            3. Create invitation

            4. Send invitation email

            5. Return result
        */

    const existingMember = await this.repository.findCompanyMemberByEmail({
      company_id: input.company_id,
      tenant_id: input.tenant_id,
      email: input.email,
    });

    if (existingMember) {
      throw new ConflictError("User is already a member of this company");
    }

    const pendingInvitation = await this.repository.findInvitationByEmail(input);
      if (pendingInvitation) {
        throw new ConflictError("A pending invitation already exists for this email");
      }

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);

    const token = Array.from(tokenBytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const tokenHash = await hashToken(token);

    const provider = new MailgunEmailProvider(env);

    const emailService = new EmailService(provider);

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const invitation = await this.repository.createInvitation({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      email: input.email,
      invited_by: input.user_id,
      invite_token_hash: tokenHash,
      expires_at: expiresAt,
      status: "SENDING",
    });

    const invitationUrl = `${env.APP_URL}/invitations/accept?token=${token}`;

    try {
      await emailService.send({
        to: input.email,
        subject: "You're invited to join LINAW",
        text: `You've been invited to join LINAW.

Accept your invitation here:
${invitationUrl}`,
        html: `
                <h2>You're invited to join LINAW</h2>

                <p>
                    You've been invited to join your organization
                    on LINAW.
                </p>

                <p>
                    <a href="${invitationUrl}">
                        Accept Invitation
                    </a>
                </p>

                <p>
                    If you did not expect this invitation,
                    you can safely ignore this email.
                </p>
        `,
      });
      await this.repository.markInvitationStatus({
        id: invitation.id,
        status: "PENDING",
      });
    } catch {
      await this.repository.markInvitationStatus({
        id: invitation.id,
        status: "REVOKED",
      });
        throw new ServiceUnavailableError("Unable to deliver the invitation");
    }

    return {
      success: true,
    };
  }

  async getUserIdentity(user_id: string, tenant_id: string) {
    return this.repository.findUserIdentity(user_id, tenant_id);
  }

  async validateInvitation(token: string) {
    const invitation = await this.repository.findInvitationByTokenHash(
      await hashToken(token),
    );
    if (
      !invitation ||
      invitation.status !== "PENDING" ||
      invitation.accepted_at ||
      invitation.expires_at <= new Date()
    ) {
      throw new InvalidTokenError("This invitation is no longer valid");
    }
    return { expires_at: invitation.expires_at };
  }

  async acceptInvitation(input: AcceptInvitationInput) {
    const result = await this.repository.acceptInvitation({
      token_hash: await hashToken(input.token),
      user_id: input.user_id,
      tenant_id: input.tenant_id,
      email: input.email.trim().toLowerCase(),
    });
    if (result.status !== "accepted") {
      throw new InvalidTokenError("This invitation is no longer valid");
    }
    return { success: true };
  }

  async getMember(input: GetInput) {
    const members = await this.repository.findMembersByCompanyId({
      company_id: input.company_id,
      tenant_id: input.tenant_id,
    });

    return members;
  }

  async getUser(input: GetUserInput) {
    const companyMember = await this.repository.findCompanyMemberByUserId({
      company_id: input.company_id,
      tenant_id: input.tenant_id,
      user_id: input.target_user_id,
    });

    if (!companyMember) {
      throw new NotFoundError("User is not a member");
    }

    return companyMember;
  }

  async updateMember(input: UpdateMemberInput) {
    const member = await this.repository.findCompanyMemberByUserId({
      company_id: input.company_id,
      tenant_id: input.tenant_id,
      user_id: input.target_user_id,
    });

    if (!member) {
      throw new NotFoundError("User is not a member");
    }

    return this.repository.updateMember({
      user_id: input.target_user_id,
      company_id: input.company_id,
      tenant_id: input.tenant_id,
      update: input.update,
    });
  }

  async removeMember(input: GetUserInput) {
    if (input.user_id === input.target_user_id) {
      throw new ConflictError("You cannot remove your own company membership");
    }

    const member = await this.repository.findCompanyMemberByUserId({
      company_id: input.company_id,
      tenant_id: input.tenant_id,
      user_id: input.target_user_id,
    });

    if (!member) {
      throw new NotFoundError("User is not a member");
    }

    return this.repository.removeMember({
      user_id: member.user_id,
      company_id: input.company_id,
      tenant_id: input.tenant_id,
    });
  }

  async role(input: RoleInput) {
    const createRole: CreateRoleContext = {
      name: input.role.name,
      description: input.role.description,
      company_id: input.company_id,
      tenant_id: input.tenant_id,
    };

    return this.repository.createRole(createRole);
  }

  async assignRoleToMember(input: AssignRoleInput) {
    const member = await this.repository.findCompanyMemberByUserId({
      company_id: input.company_id,
      tenant_id: input.tenant_id,
      user_id: input.member_user_id,
    });

    if (!member) {
      throw new NotFoundError("Company member not found");
    }

    const role = await this.repository.findRoleById({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      role_id: input.assignRole.role_id,
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    const assign: AssignRoleContext = {
      user_id: member.user_id,
      role_id: input.assignRole.role_id,
      company_id: input.company_id,
      tenant_id: input.tenant_id,
    };

    return this.repository.assignRole(assign);
  }

  async assignPermissionsToRole(input: AssignPermissionsInput) {
    const role = await this.repository.findRoleById({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      role_id: input.role_id,
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    const assignments = input.permissions.permissionIds.map(
      (permission_id) => ({
        role_id: input.role_id,
        permission_id,
      }),
    );

    return this.repository.assignPermissionsToRole(assignments);
  }

  async getRoles(input: GetInput) {
    return this.repository.findRolesByCompanyId({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });
  }

  async getRole(input: GetRolesInput) {
    return this.repository.findRoleById({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      role_id: input.role_id,
    });
  }

  async getRolePermissions(input: GetRolesInput) {
    return this.repository.findRolePermissions({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      role_id: input.role_id,
    });
  }

  async getPermissions() {
    return this.repository.findPermissions();
  }

  async updateRole(input: UpdateRoleInput) {
    const role = await this.repository.findRoleById({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      role_id: input.role_id,
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    return this.repository.updateRole({
      role_id: input.role_id,
      update: input.update,
    });
  }

  async deleteRole(input: GetRolesInput) {
    const role = await this.repository.findRoleById({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      role_id: input.role_id,
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    if (role.is_system) {
      throw new Error("System roles cannot be deleted");
    }

    return this.repository.deleteRole(input.role_id);
  }

  async deletePermissionsFromRole(input: deletePermissionsFromRoleInput) {
    const role = await this.repository.findRoleById({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      role_id: input.role_id,
    });

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    if (role.is_system) {
      throw new Error("Permissions cannot be removed from system roles");
    }

    return this.repository.deletePermissionFromRole({
      role_id: input.role_id,
      permission_id: input.permission_id,
    });
  }

  async removeRoleFromMember(input: RemoveRoleFromMemberInput) {
    const member = await this.repository.findCompanyMemberByUserId({
      company_id: input.company_id,
      tenant_id: input.tenant_id,
      user_id: input.member_user_id,
    });

    if (!member) {
      throw new NotFoundError("Company member not found");
    }

    return this.repository.removeRoleFromMember({
      user_id: member.user_id,
      company_id: input.company_id,
      tenant_id: input.tenant_id,
      role_id: input.role_id,
    });
  }

  async settings(input: GetInput) {
    return this.repository.findCompanySettings({
      company_id: input.company_id,
    });
  }

  async updateSettings(input: UpdateSettingsInput) {
    const settings = await this.repository.findCompanySettings({
      company_id: input.company_id,
    });

    if (!settings) {
      throw new NotFoundError("Company settings not found");
    }

    return this.repository.updateCompanySettings({
      company_id: input.company_id,
      update: input.updateSettings,
    });
  }

  // async auditTrail(input: GetInput) {
  //     //return this.repository.findAuditTrail(input.company_id)
  // }
}

/*
    dev note:   audit trail here need to have an publish event to the audti trail 
                module to query the db for that. I'll finish up the rest for MVP 
                before coming back to this.
*/
