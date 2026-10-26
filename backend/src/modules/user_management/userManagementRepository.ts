import { prisma } from "../../config/database.js";

export class UserManagementRepository {
  async registerCompany(data: {
    userId: string;
    tenantId: string;
    legal_name: string;
    display_name: string;
    tax_id?: string;
    address: string;
    contact_email: string;
    contact_phone?: string;
  }) {
    return prisma.$transaction(
      async (tx) => {
        const existingMembership = await tx.companyMembership.findFirst({
          where: {
            user_id: data.userId,
            tenant_id: data.tenantId,
          },
          select: {
            id: true,
          },
        });

        if (existingMembership) {
          return { status: "duplicate" as const };
        }

        const ownerRole = await tx.role.findFirst({
          where: {
            code: "ORGANIZATION_ADMIN",
            is_system: true,
            tenant_id: null,
          },
        });

        if (!ownerRole) {
          return { status: "missing_role" as const };
        }

        const company = await tx.company.create({
          data: {
            tenant_id: data.tenantId,
            legal_name: data.legal_name,
            display_name: data.display_name,
            tax_id: data.tax_id,
            address: data.address,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
          },
        });

        await tx.companyMembership.create({
          data: {
            user_id: data.userId,
            company_id: company.id,
            tenant_id: data.tenantId,
            role_id: ownerRole.id,
            employment_status: "ACTIVE",
          },
        });

        await tx.userRole.create({
          data: {
            user_id: data.userId,
            company_id: company.id,
            tenant_id: data.tenantId,
            role_id: ownerRole.id,
          },
        });

        return {
          status: "created" as const,
          company,
        };
      },
      {
        isolationLevel: "Serializable",
      },
    );
  }

  async findById(userId: string, tenantId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
        tenant_id: tenantId,
      },
      include: {
        company_memberships: {
          where: { employment_status: "ACTIVE" },
          take: 1,
          include: { company: { select: { display_name: true } } },
        },
      },
    });
  }

  async updateProfile(data: {
    userId: string;
    tenantId: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    job_title?: string;
  }) {
    const result = await prisma.user.updateMany({
      where: {
        id: data.userId,
        tenant_id: data.tenantId,
      },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        job_title: data.job_title,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(data.userId, data.tenantId);
  }

  async createCompany(data: {
    tenantId: string;
    legal_name: string;
    display_name: string;
    tax_id?: string;
    address: string;
    contact_email: string;
    contact_phone?: string;
  }) {
    return prisma.company.create({
      data: {
        tenant_id: data.tenantId,
        legal_name: data.legal_name,
        display_name: data.display_name,
        tax_id: data.tax_id,
        address: data.address,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
      },
    });
  }

  async createCompanyMembership(data: {
    userId: string;
    companyId: string;
    tenantId: string;
  }) {
    return prisma.companyMembership.create({
      data: {
        user_id: data.userId,
        company_id: data.companyId,
        tenant_id: data.tenantId,
        employment_status: "ACTIVE",
      },
    });
  }

  async createUserRole(data: {
    userId: string;
    companyId: string;
    tenantId: string;
    roleId: string;
  }) {
    return prisma.userRole.create({
      data: {
        user_id: data.userId,
        company_id: data.companyId,
        tenant_id: data.tenantId,
        role_id: data.roleId,
      },
    });
  }

  async findRoleByCode(code: string) {
    return prisma.role.findFirst({
      where: {
        code,
        is_system: true,
      },
    });
  }

  async findSystemRoleByCode(code: string) {
    return prisma.role.findFirst({
      where: {
        code,
        is_system: true,
        tenant_id: null,
      },
    });
  }
}
