import { prisma } from "../../config/database";
import type {
  removePermission,
  updateMember,
  updateRole,
  updateSettings,
} from "./organizationAdministrationValidator";

export interface UserContext {
  user_id: string;
}

export interface CompanyContext {
  company_id: string;
}

export interface TenantContext {
  tenant_id: string;
}

export interface Company extends UserContext {
  company_id: string;
}

export interface Tenant extends UserContext {
  tenant_id: string;
}

export interface FindUserContext extends CompanyContext {
  email: string;
}

export interface UpdateMemberRepositoryInput extends Company {
  tenant_id: string;
  update: updateMember;
}

export interface RemoveMemberRepositoryInput extends Company {
  tenant_id: string;
}

export type ScopedRepositoryContext = Company | Tenant | (Company & Tenant);

export interface AssignRoleContext extends Company {
  tenant_id: string;
  role_id: string;
}

export interface CreateInvitationContext {
  tenant_id: string;
  company_id: string;
  email: string;
  invited_by: string;
  invite_token_hash: string;
  expires_at: Date;
  status: string;
}

export interface CreateRoleContext {
  name: string;
  description: string;
  company_id: string;
  tenant_id: string;
}

export interface RoleCompanyContext extends CompanyContext {
  tenant_id: string;
  role_id: string;
}

export interface RoleTenantContext extends TenantContext {
  company_id: string;
  role_id: string;
}

export interface AssignmentContext {
  role_id: string;
  permission_id: string;
}

export interface UpdateRoleContext {
  role_id: string;
  update: updateRole;
}

export interface DeletePermissionFromRoleContext {
  role_id: string;
  permission_id: removePermission["permission_id"];
}

export interface UpdateCompanySettingsContext extends CompanyContext {
  update: updateSettings;
}

export interface RemoveRoleFromMemberContext extends Company {
  tenant_id: string;
  role_id: string;
}

export class OrganizationAdministrationRepository {
  // find

  async findUserByEmail(input: TenantContext & { email: string }) {
    return prisma.user.findUnique({
      where: {
        tenant_id_email: {
          email: input.email,
          tenant_id: input.tenant_id,
        },
      },
    });
  }

  async findUserIdentity(user_id: string, tenant_id: string) {
    return prisma.user.findFirst({
      where: { id: user_id, tenant_id },
      select: { id: true, email: true },
    });
  }

  async findInvitationByEmail(
    input: CompanyContext & TenantContext & { email: string },
  ) {
    return prisma.companyInvitation.findFirst({
      where: {
        tenant_id: input.tenant_id,
        company_id: input.company_id,
        email: input.email,
        status: "PENDING",
        expires_at: { gt: new Date() },
      },
    });
  }

  async findInvitationByTokenHash(token_hash: string) {
    return prisma.companyInvitation.findUnique({
      where: { invite_token_hash: token_hash },
    });
  }

  async markInvitationStatus(input: {
    id: string;
    status: string;
    accepted_at?: Date | null;
  }) {
    return prisma.companyInvitation.update({
      where: { id: input.id },
      data: {
        status: input.status,
        ...(input.accepted_at !== undefined
          ? { accepted_at: input.accepted_at }
          : {}),
      },
    });
  }

  async acceptInvitation(input: {
    token_hash: string;
    user_id: string;
    tenant_id: string;
    email: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const invitation = await tx.companyInvitation.findUnique({
        where: { invite_token_hash: input.token_hash },
      });

      if (
        !invitation ||
        invitation.status !== "PENDING" ||
        invitation.accepted_at ||
        invitation.expires_at <= new Date() ||
        invitation.tenant_id !== input.tenant_id ||
        invitation.email !== input.email
      ) {
        return { status: "invalid" as const };
      }

      const claimed = await tx.companyInvitation.updateMany({
        where: {
          id: invitation.id,
          status: "PENDING",
          accepted_at: null,
          expires_at: { gt: new Date() },
        },
        data: { status: "ACCEPTED", accepted_at: new Date() },
      });

      if (claimed.count !== 1) return { status: "invalid" as const };

      const activeMemberships = await tx.companyMembership.findMany({
        where: {
          user_id: input.user_id,
          tenant_id: invitation.tenant_id,
          employment_status: "ACTIVE",
        },
        select: { company_id: true },
      });

      if (
        activeMemberships.some(
          (membership) => membership.company_id !== invitation.company_id,
        )
      ) {
        return { status: "invalid" as const };
      }

      const membership = await tx.companyMembership.upsert({
        where: {
          tenant_id_company_id_user_id: {
            tenant_id: invitation.tenant_id,
            company_id: invitation.company_id,
            user_id: input.user_id,
          },
        },
        create: {
          tenant_id: invitation.tenant_id,
          company_id: invitation.company_id,
          user_id: input.user_id,
          employment_status: "ACTIVE",
        },
        update: {},
      });

      return { status: "accepted" as const, membership };
    });
  }

  async findMembersByCompanyId(input: CompanyContext & TenantContext) {
    return prisma.companyMembership.findMany({
      where: {
        company_id: input.company_id,
        tenant_id: input.tenant_id,
      },
      include: {
        user: true,
        role: true,
      },
    });
  }

  async findCompanyMemberByEmail(input: FindUserContext & TenantContext) {
    return prisma.companyMembership.findFirst({
      where: {
        company_id: input.company_id,
        tenant_id: input.tenant_id,
        user: {
          email: input.email,
        },
      },
      include: {
        user: true,
        role: true,
      },
    });
  }

  async findCompanyMemberByUserId(input: Company & TenantContext) {
    return prisma.companyMembership.findFirst({
      where: {
        company_id: input.company_id,
        tenant_id: input.tenant_id,
        user_id: input.user_id,
      },
      include: {
        user: true,
        role: true,
      },
    });
  }

  async findRoleById(input: RoleCompanyContext) {
    return prisma.role.findFirst({
      where: {
        id: input.role_id,
        company_id: input.company_id,
        tenant_id: input.tenant_id,
      },
    });
  }

  async findRolesByCompanyId(input: CompanyContext & TenantContext) {
    return prisma.role.findMany({
      where: {
        OR: [
          {
            tenant_id: input.tenant_id,
            company_id: input.company_id,
          },
          {
            tenant_id: null,
            company_id: null,
            is_system: true,
          },
        ],
      },
    });
  }

  async findRolePermissions(input: RoleTenantContext) {
    return prisma.rolePermission.findMany({
      where: {
        role_id: input.role_id,
        role: {
          tenant_id: input.tenant_id,
          company_id: input.company_id,
        },
      },
      include: {
        permission: true,
      },
    });
  }

  async findPermissions() {
    return prisma.permission.findMany();
  }

  async findCompanySettings(input: CompanyContext) {
    return prisma.company.findUnique({
      where: {
        id: input.company_id,
      },
    });
  }

  // create

  async createInvitation(input: CreateInvitationContext) {
    return prisma.companyInvitation.create({
      data: {
        tenant_id: input.tenant_id,
        company_id: input.company_id,
        email: input.email,
        invited_by: input.invited_by,
        invite_token_hash: input.invite_token_hash,
        status: input.status,
        expires_at: input.expires_at,
      },
    });
  }

  async createRole(input: CreateRoleContext) {
    const code = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return prisma.role.create({
      data: {
        name: input.name,
        description: input.description,
        company_id: input.company_id,
        tenant_id: input.tenant_id,
        code,
      },
    });
  }

  // update

  async updateMember(input: UpdateMemberRepositoryInput) {
    return prisma.companyMembership.update({
      where: {
        tenant_id_company_id_user_id: {
          tenant_id: input.tenant_id,
          company_id: input.company_id,
          user_id: input.user_id,
        },
      },
      data: {
        role_id: input.update.role_id,
        employment_status: input.update.employment_status,
        job_title: input.update.jobTitle,
      },
    });
  }

  async assignRole(input: AssignRoleContext) {
    return prisma.userRole.create({
      data: {
        user_id: input.user_id,
        company_id: input.company_id,
        tenant_id: input.tenant_id,
        role_id: input.role_id,
      },
    });
  }

  async assignPermissionsToRole(input: AssignmentContext[]) {
    return prisma.rolePermission.createMany({
      data: input,
      skipDuplicates: true,
    });
  }

  async updateRole(input: UpdateRoleContext) {
    return prisma.role.update({
      where: {
        id: input.role_id,
      },
      data: {
        name: input.update.name,
        description: input.update.description,
      },
    });
  }

  async updateCompanySettings(input: UpdateCompanySettingsContext) {
    return prisma.company.update({
      where: {
        id: input.company_id,
      },
      data: {
        contact_email: input.update.companyEmail,
        display_name: input.update.displayName,
        legal_name: input.update.legalName,
        contact_phone: input.update.contactNumber,
        address: input.update.address,
      },
    });
  }

  // remove / delete

  async removeMember(input: RemoveMemberRepositoryInput) {
    return prisma.companyMembership.deleteMany({
      where: {
        company_id: input.company_id,
        tenant_id: input.tenant_id,
        user_id: input.user_id,
      },
    });
  }

  async deleteRole(role_id: string) {
    return prisma.role.delete({
      where: {
        id: role_id,
      },
    });
  }

  async deletePermissionFromRole(input: DeletePermissionFromRoleContext) {
    return prisma.rolePermission.deleteMany({
      where: {
        role_id: input.role_id,
        permission_id: input.permission_id,
      },
    });
  }

  async removeRoleFromMember(input: RemoveRoleFromMemberContext) {
    return prisma.userRole.deleteMany({
      where: {
        company_id: input.company_id,
        tenant_id: input.tenant_id,
        user_id: input.user_id,
        role_id: input.role_id,
      },
    });
  }
}
