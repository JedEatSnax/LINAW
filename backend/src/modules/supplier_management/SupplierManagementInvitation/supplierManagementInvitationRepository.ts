import { prisma } from "../../../config/database.js";

export class SupplierManagementInvitationRepository {
  /**
   * Create a draft invitation for a supplier.
   *
   * The invitation belongs to the purchasing company that created it.
   * The invitation token is generated later, when the invitation is sent.
   */
  async createInvitation(input: {
    user_id: string;
    tenant_id: string;
    company_id: string;
    email: string;
  }) {
    return prisma.supplierInvitation.create({
      data: {
        tenant_id: input.tenant_id,
        company_id: input.company_id,
        invited_by_user_id: input.user_id,
        email: input.email,
        status: "DRAFT",
      },
    });
  }

  /**
   * Retrieve invitations belonging to a purchasing company.
   */
  async getInvitations(input: {
    user_id: string;
    tenant_id: string;
    company_id: string;
    status?: string;
    email?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      ...(input.status ? { status: input.status } : {}),
      ...(input.email
        ? { email: { contains: input.email, mode: "insensitive" as const } }
        : {}),
    };

    const [invitations, total] = await prisma.$transaction([
      prisma.supplierInvitation.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.supplierInvitation.count({ where }),
    ]);

    return { invitations, total };
  }

  /**
   * Retrieve one invitation within the authenticated company's scope.
   */
  async getInvitation(input: {
    user_id: string;
    tenant_id: string;
    company_id: string;
    invitation_id: string;
  }) {
    return prisma.supplierInvitation.findFirst({
      where: {
        id: input.invitation_id,
        tenant_id: input.tenant_id,
        company_id: input.company_id,
      },
    });
  }

  /**
   * Store the hashed token and expiration before sending the email.
   *
   * DRAFT -> SENDING
   *
   * The conditional update prevents two concurrent requests from
   * preparing the same draft invitation successfully.
   */
  async prepareInvitationForSending(input: {
    invitation_id: string;
    tenant_id: string;
    company_id: string;
    token_hash: string;
    expires_at: Date;
  }) {
    const result = await prisma.supplierInvitation.updateMany({
      where: {
        id: input.invitation_id,
        tenant_id: input.tenant_id,
        company_id: input.company_id,
        OR: [
          { status: "DRAFT" },
          { status: "PENDING", expires_at: { lte: new Date() } },
        ],
      },
      data: {
        token_hash: input.token_hash,
        expires_at: input.expires_at,
        status: "SENDING",
      },
    });

    return result.count > 0;
  }

  async resetInvitationToDraft(input: {
    invitation_id: string;
    tenant_id: string;
    company_id: string;
  }) {
    return prisma.supplierInvitation.updateMany({
      where: {
        id: input.invitation_id,
        tenant_id: input.tenant_id,
        company_id: input.company_id,
        status: "SENDING",
      },
      data: {
        status: "DRAFT",
        token_hash: null,
        expires_at: null,
      },
    });
  }

  /**
   * Mark an invitation as pending after the email provider accepts
   * the email submission.
   *
   * SENDING -> PENDING
   */
  async markInvitationPending(input: {
    invitation_id: string;
    tenant_id: string;
    company_id: string;
  }) {
    const result = await prisma.supplierInvitation.updateMany({
      where: {
        id: input.invitation_id,
        tenant_id: input.tenant_id,
        company_id: input.company_id,
        status: "SENDING",
      },
      data: {
        status: "PENDING",
      },
    });

    return result.count > 0;
  }

  /**
   * Look up an invitation using its SHA-256 token hash.
   *
   * The raw invitation token is never stored in the database.
   */
  async findInvitationByTokenHash(input: { token_hash: string }) {
    return prisma.supplierInvitation.findUnique({
      where: {
        token_hash: input.token_hash,
      },
      select: {
        id: true,
        tenant_id: true,
        company_id: true,
        email: true,
        token_hash: true,
        status: true,
        expires_at: true,
        accepted_at: true,
      },
    });
  }

  /**
   * Resolve the authenticated recipient's account.
   */
  async findAcceptingUser(input: { user_id: string; tenant_id: string }) {
    return prisma.user.findFirst({
      where: {
        id: input.user_id,
        tenant_id: input.tenant_id,
      },
      select: {
        id: true,
        email: true,
      },
    });
  }

  async findUserByEmail(input: { tenant_id: string; email: string }) {
    return prisma.user.findFirst({
      where: {
        tenant_id: input.tenant_id,
        email: { equals: input.email, mode: "insensitive" },
        status: "ACTIVE",
      },
      select: { id: true },
    });
  }

  /**
   * Retrieve the user's active company memberships.
   */
  async findActiveCompanyMemberships(input: {
    user_id: string;
    tenant_id: string;
  }) {
    return prisma.companyMembership.findMany({
      where: {
        user_id: input.user_id,
        tenant_id: input.tenant_id,
        employment_status: "ACTIVE",
      },
      select: {
        company_id: true,
      },
    });
  }

  /**
   * Accept an invitation and establish the supplier relationship.
   *
   * All database changes happen in one transaction:
   *
   * 1. Revalidate the invitation and its expiration.
   * 2. Verify the recipient's account and email.
   * 3. Verify the recipient's active company membership.
   * 4. Resolve or create the Supplier record.
   * 5. Create or reactivate the purchasing company's relationship.
   * 6. Conditionally mark the invitation as accepted.
   *
   * If any step fails, the transaction rolls back.
   */
  async acceptInvitation(input: {
    invitation_id: string;
    token_hash: string;
    user_id: string;
    tenant_id: string;
    company_id: string;
    accepted_at: Date;
  }): Promise<{
    relationship_id: string;
    accepted_at: Date;
  } | null> {
    return prisma.$transaction(async (tx) => {
      // Recheck the invitation inside the transaction.
      const invitation = await tx.supplierInvitation.findFirst({
        where: {
          id: input.invitation_id,
          token_hash: input.token_hash,
          status: "PENDING",
          expires_at: {
            gt: input.accepted_at,
          },
        },
      });

      if (!invitation) {
        return null;
      }

      // Verify the authenticated account still exists in its tenant.
      const user = await tx.user.findFirst({
        where: {
          id: input.user_id,
          tenant_id: input.tenant_id,
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (!user) {
        return null;
      }

      // Invitation acceptance must be performed by the invited email.
      if (
        user.email.trim().toLowerCase() !==
        invitation.email.trim().toLowerCase()
      ) {
        return null;
      }

      // Verify that the recipient belongs to the selected company.
      const membership = await tx.companyMembership.findFirst({
        where: {
          user_id: input.user_id,
          tenant_id: input.tenant_id,
          company_id: input.company_id,
          employment_status: "ACTIVE",
        },
        select: {
          company_id: true,
        },
      });

      if (!membership) {
        return null;
      }

      // Resolve the accepting supplier company's own tenant.
      const supplierCompany = await tx.company.findFirst({
        where: {
          id: input.company_id,
          tenant_id: input.tenant_id,
        },
        select: {
          id: true,
          tenant_id: true,
        },
      });

      if (!supplierCompany) {
        return null;
      }

      // Confirm that the purchasing company belongs to the tenant
      // recorded on the invitation.
      const purchasingCompany = await tx.company.findFirst({
        where: {
          id: invitation.company_id,
          tenant_id: invitation.tenant_id,
        },
        select: {
          id: true,
        },
      });

      if (!purchasingCompany) {
        return null;
      }

      // Reuse an existing Supplier record for this supplier company.
      let supplier = await tx.supplier.findFirst({
        where: {
          tenant_id: supplierCompany.tenant_id,
          company_id: supplierCompany.id,
        },
        select: {
          id: true,
        },
      });

      if (!supplier) {
        /*
         * Supplier.supplier_code is required by the current design.
         *
         * Use the supplier company's UUID as the deterministic
         * source of the code so that this repository does not
         * depend on an unverified code-generation convention.
         */
        const supplierCode = `SUP-${supplierCompany.id.replaceAll("-", "").toUpperCase()}`;

        supplier = await tx.supplier.create({
          data: {
            tenant_id: supplierCompany.tenant_id,
            company_id: supplierCompany.id,
            supplier_code: supplierCode,
            status: "ACTIVE",
          },
          select: {
            id: true,
          },
        });
      }

      // Create the relationship or reactivate an existing one.
      //
      // IMPORTANT:
      // tenant_id and company_id come from the invitation because
      // they identify the purchasing company.
      //
      // supplier_id points to the Supplier record belonging to the
      // accepting supplier company's own tenant.
      const relationship = await tx.supplierCompanyRelationship.upsert({
        where: {
          tenant_id_company_id_supplier_id: {
            tenant_id: invitation.tenant_id,
            company_id: invitation.company_id,
            supplier_id: supplier.id,
          },
        },
        create: {
          tenant_id: invitation.tenant_id,
          company_id: invitation.company_id,
          supplier_id: supplier.id,
          relationship_status: "ACTIVE",
        },
        update: {
          relationship_status: "ACTIVE",
        },
        select: {
          id: true,
        },
      });

      // Perform a conditional state transition.
      //
      // If another request has already accepted the invitation,
      // this update affects zero rows and the transaction rolls back.
      const updatedInvitation = await tx.supplierInvitation.updateMany({
        where: {
          id: invitation.id,
          token_hash: input.token_hash,
          status: "PENDING",
          expires_at: {
            gt: input.accepted_at,
          },
        },
        data: {
          status: "ACCEPTED",
          accepted_at: input.accepted_at,
        },
      });

      if (updatedInvitation.count !== 1) {
        return null;
      }

      return {
        relationship_id: relationship.id,
        accepted_at: input.accepted_at,
      };
    });
  }
}
