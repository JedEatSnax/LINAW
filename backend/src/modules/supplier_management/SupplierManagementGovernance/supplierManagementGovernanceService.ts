import { NotFoundError } from "../../../shared/errors/appError.js";
import { SupplierManagementGovernanceRepository } from "./supplierManagementGovernanceRepository.js";
import type { SupplierQuery } from "./supplierManagementGovernanceValidator.js";

interface SupplierGovernanceContext {
  tenant_id: string;
  company_id: string;
}

interface SupplierListContext
  extends SupplierGovernanceContext, SupplierQuery {}

interface SupplierGovernanceSupplierContext extends SupplierGovernanceContext {
  supplier_id: string;
}

export class SupplierManagementGovernanceService {
  private toSupplierResponse(supplier: {
    id: string;
    supplier_code: string;
    status: string;
    company: {
      id: string;
      legal_name: string;
      display_name: string;
      tax_id: string | null;
      address: string | null;
      contact_email: string | null;
      contact_phone: string | null;
    };
    company_relationships: {
      id: string;
      relationship_status: string;
      created_at: Date;
      updated_at: Date;
    }[];
    created_at: Date;
    updated_at: Date;
  }) {
    const relationship = supplier.company_relationships[0];

    return {
      supplier_id: supplier.id,
      supplier_code: supplier.supplier_code,
      company_id: supplier.company.id,
      legal_name: supplier.company.legal_name,
      display_name: supplier.company.display_name,
      tax_id: supplier.company.tax_id,
      contact_email: supplier.company.contact_email,
      contact_phone: supplier.company.contact_phone,
      address: supplier.company.address,
      supplier_status: supplier.status,
      relationship_status: relationship?.relationship_status ?? null,
      ...(relationship
        ? {
            relationship: {
              relationship_id: relationship.id,
              relationship_status: relationship.relationship_status,
            },
          }
        : {}),
      created_at: supplier.created_at,
      updated_at: supplier.updated_at,
    };
  }

  constructor(private repository: SupplierManagementGovernanceRepository) {}

  /**
   * List suppliers associated with the authenticated purchasing company.
   */
  async getSuppliers(input: SupplierListContext) {
    const result = await this.repository.getSuppliers(input);

    return {
      suppliers: result.suppliers.map((supplier) =>
        this.toSupplierResponse(supplier),
      ),
      pagination: {
        page: input.page,
        limit: input.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / input.limit),
      },
    };
  }

  /**
   * Retrieve supplier details while enforcing relationship ownership.
   */
  async getSupplier(input: SupplierGovernanceSupplierContext) {
    const supplier = await this.repository.getSupplier(input);

    if (!supplier) {
      throw new NotFoundError(
        "Supplier does not exist or is not associated with this company.",
      );
    }

    return this.toSupplierResponse(supplier);
  }

  /**
   * Deactivate an active supplier relationship without deleting records.
   */
  async removeSupplierRelationship(input: SupplierGovernanceSupplierContext) {
    const result = await this.repository.deactivateRelationship(input);

    if (!result) {
      throw new NotFoundError("Active supplier relationship was not found.");
    }

    return {
      supplier_id: input.supplier_id,
      relationship_id: result.id,
      relationship_status: "INACTIVE",
    };
  }
}
