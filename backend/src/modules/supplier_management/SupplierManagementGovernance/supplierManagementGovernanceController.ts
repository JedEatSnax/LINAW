import type { Context } from "hono";
import type { AppContext } from "../../../shared/types/hono.js";
import { NotFoundError } from "../../../shared/errors/appError.js";
import type { SupplierManagementGovernanceService } from "./supplierManagementGovernanceService.js";
import {
  SupplierIdSchema,
  SupplierQuerySchema,
} from "./supplierManagementGovernanceValidator.js";

export class SupplierManagementGovernanceController {
  constructor(private service: SupplierManagementGovernanceService) {}

  getSuppliers = async (c: Context<AppContext>) => {
    const { tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company.");
    }

    const query = SupplierQuerySchema.parse(c.req.query());
    const suppliers = await this.service.getSuppliers({
      tenant_id,
      company_id,
      ...query,
    });

    return c.json({
      success: true,
      message: "Suppliers retrieved successfully.",
      data: suppliers,
    });
  };

  getSupplier = async (c: Context<AppContext>) => {
    const { tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company.");
    }

    const { supplierId } = SupplierIdSchema.parse({
      supplierId: c.req.param("supplierId"),
    });

    const supplier = await this.service.getSupplier({
      tenant_id,
      company_id,
      supplier_id: supplierId,
    });

    return c.json({
      success: true,
      message: "Supplier retrieved successfully.",
      data: supplier,
    });
  };

  removeSupplierRelationship = async (c: Context<AppContext>) => {
    const { tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company.");
    }

    const { supplierId } = SupplierIdSchema.parse({
      supplierId: c.req.param("supplierId"),
    });

    const result = await this.service.removeSupplierRelationship({
      tenant_id,
      company_id,
      supplier_id: supplierId,
    });

    return c.json({
      success: true,
      message: "Supplier relationship deactivated successfully.",
      data: result,
    });
  };
}
