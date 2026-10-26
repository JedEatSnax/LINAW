import { prisma } from "../../../config/database.js";

export class SupplierManagementGovernanceRepository {
  /**
   * List active suppliers associated with the purchasing company.
   */
  async getSuppliers(input: {
    tenant_id: string;
    company_id: string;
    name?: string;
    status?: string;
    relationship_status?: string;
    page: number;
    limit: number;
  }) {
    const relationshipStatus = input.relationship_status ?? "ACTIVE";
    const where = {
      ...(input.status ? { status: input.status } : { status: "ACTIVE" }),
      ...(input.name
        ? {
            company: {
              OR: [
                {
                  legal_name: {
                    contains: input.name,
                    mode: "insensitive" as const,
                  },
                },
                {
                  display_name: {
                    contains: input.name,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          }
        : {}),
      company_relationships: {
        some: {
          tenant_id: input.tenant_id,
          company_id: input.company_id,
          relationship_status: relationshipStatus,
        },
      },
    };

    const include = {
      company: {
        select: {
          id: true,
          legal_name: true,
          display_name: true,
          tax_id: true,
          address: true,
          contact_email: true,
          contact_phone: true,
        },
      },
      company_relationships: {
        where: {
          tenant_id: input.tenant_id,
          company_id: input.company_id,
        },
        select: {
          id: true,
          relationship_status: true,
          created_at: true,
          updated_at: true,
        },
      },
    };

    const [suppliers, total] = await prisma.$transaction([
      prisma.supplier.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include,
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total };
  }

  /**
   * Retrieve one active supplier associated with the purchasing company.
   */
  async getSupplier(input: {
    tenant_id: string;
    company_id: string;
    supplier_id: string;
  }) {
    return prisma.supplier.findFirst({
      where: {
        id: input.supplier_id,
        status: "ACTIVE",
        company_relationships: {
          some: {
            tenant_id: input.tenant_id,
            company_id: input.company_id,
            relationship_status: "ACTIVE",
          },
        },
      },
      include: {
        company: {
          select: {
            id: true,
            legal_name: true,
            display_name: true,
            tax_id: true,
            address: true,
            contact_email: true,
            contact_phone: true,
          },
        },
        company_relationships: {
          where: {
            tenant_id: input.tenant_id,
            company_id: input.company_id,
          },
          select: {
            id: true,
            relationship_status: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });
  }

  /**
   * Deactivate the purchasing company's relationship with a supplier.
   * The supplier record and procurement history are preserved.
   */
  async deactivateRelationship(input: {
    tenant_id: string;
    company_id: string;
    supplier_id: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const relationship = await tx.supplierCompanyRelationship.findFirst({
        where: {
          tenant_id: input.tenant_id,
          company_id: input.company_id,
          supplier_id: input.supplier_id,
          relationship_status: "ACTIVE",
        },
        select: { id: true },
      });

      if (!relationship) {
        return null;
      }

      const result = await tx.supplierCompanyRelationship.updateMany({
        where: {
          id: relationship.id,
          relationship_status: "ACTIVE",
        },
        data: { relationship_status: "INACTIVE" },
      });

      return result.count === 1 ? relationship : null;
    });
  }
}
