import type { AppContext } from "../../../shared/types/hono.js";
import type { Context } from "hono";

import { NotFoundError } from "../../../shared/errors/appError.js";

import type { SupplierManagementPortalService } from "./supplierManagementPortalService.js";

import {
  SupplierPortalRFQIdSchema,
  SupplierQuotationIdSchema,
  SubmitSupplierQuotationSchema,
} from "./supplierManagementPortalValidator.js";

export class SupplierManagementPortalController {
  constructor(private service: SupplierManagementPortalService) {}

  // ====================
  // Get Available RFQs
  // ====================

  getAvailableRFQs = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
    };

    const rfqs = await this.service.getAvailableRFQs(input);

    return c.json({
      success: true,
      message: "Available RFQs retrieved successfully.",
      data: rfqs,
    });
  };

  // ====================
  // Get RFQ Details
  // ====================

  getRFQ = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const { rfqId } = SupplierPortalRFQIdSchema.parse({
      rfqId: c.req.param("rfqId"),
    });

    const input = {
      user_id,
      tenant_id,
      company_id,
      rfq_id: rfqId,
    };

    const rfq = await this.service.getRFQ(input);

    return c.json({
      success: true,
      message: "RFQ retrieved successfully.",
      data: rfq,
    });
  };

  // ====================
  // Get Supplier Quotations
  // ====================

  getQuotations = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
    };

    const quotations = await this.service.getQuotations(input);

    return c.json({
      success: true,
      message: "Supplier quotations retrieved successfully.",
      data: quotations,
    });
  };

  // ====================
  // Get Quotation Details
  // ====================

  getQuotation = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const { quotationId } = SupplierQuotationIdSchema.parse({
      quotationId: c.req.param("quotationId"),
    });

    const input = {
      user_id,
      tenant_id,
      company_id,
      quotation_id: quotationId,
    };

    const quotation = await this.service.getQuotation(input);

    return c.json({
      success: true,
      message: "Supplier quotation retrieved successfully.",
      data: quotation,
    });
  };

  // ====================
  // Submit Supplier Quotation
  // ====================

  submitQuotation = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const { rfqId } = SupplierPortalRFQIdSchema.parse({
      rfqId: c.req.param("rfqId"),
    });

    const body = SubmitSupplierQuotationSchema.parse(await c.req.json());

    const input = {
      user_id,
      tenant_id,
      company_id,
      rfq_id: rfqId,
      body,
    };

    const quotation = await this.service.submitQuotation(input);

    return c.json(
      {
        success: true,
        message: "Supplier quotation submitted successfully.",
        data: quotation,
      },
      201,
    );
  };
}
