import type { AppContext } from "../../shared/types/hono.js";
import { Context } from "hono";
import { PurchaseOrderManagementService } from "./purchaseOrderManagementService";
import {
  CreateRFQSchema,
  ListPurchaseOrdersQuerySchema,
  ListRFQsQuerySchema,
  ProcurementQueueQuerySchema,
  PurchaseOrderIdParamsSchema,
  QuotationParamsSchema,
  RFQIdParamsSchema,
  UpdatePurchaseOrderSchema,
  UpdateRFQSchema,
  MonthlyCompletedProcurementQuerySchema,
} from "./purchaseOrderManagementValidator";
import { NotFoundError } from "../../shared/errors/appError.js";

export class PurchaseOrderManagementController {
  constructor(private service: PurchaseOrderManagementService) {}

  orderPurchaseOrder = async (c: Context<AppContext>) => {
    const { poId } = await PurchaseOrderIdParamsSchema.parse(c.req.param());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      poId,
    };

    const createdPO = await this.service.orderPurchaseOrder(input);

    return c.json(
      {
        success: true,
        message: "Successfully Created Purchase Order",
        createdPO,
      },
      200,
    );
  };

  completePurchaseOrder = async (c: Context<AppContext>) => {
    const { poId } = PurchaseOrderIdParamsSchema.parse(c.req.param());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const completedPO = await this.service.completePurchaseOrder({
      user_id,
      tenant_id,
      company_id,
      poId,
    });

    return c.json(
      {
        success: true,
        message: "Purchase order completed",
        completedPO,
      },
      200,
    );
  };

  createRFQS = async (c: Context<AppContext>) => {
    const body = CreateRFQSchema.parse(await c.req.json());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      body,
    };

    const createRfq = await this.service.createRFQS(input);

    return c.json(
      {
        success: true,
        message: "Successful",
        createRfq,
      },
      201,
    );
  };

  publishRfqs = async (c: Context<AppContext>) => {
    const params = RFQIdParamsSchema.parse(c.req.param());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      params,
    };

    const published = await this.service.publishRFQS(input);

    return c.json(
      {
        success: true,
        message: "Successfully published RFQS",
        published,
      },
      200,
    );
  };

  selectSupplier = async (c: Context<AppContext>) => {
    const params = QuotationParamsSchema.parse(c.req.param());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      params,
    };

    const selectedSupplier = await this.service.selectSupplier(input);

    return c.json(
      {
        success: true,
        message: "Supplier has been selected",
        selectedSupplier,
      },
      200,
    );
  };

  getList = async (c: Context<AppContext>) => {
    const query = ListPurchaseOrdersQuerySchema.parse(c.req.query());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      query,
    };

    const list = await this.service.getList(input);
    const total = await this.service.countList(input);

    return c.json(
      {
        success: true,
        message: "Success list is returned",
        list,
        total,
      },
      200,
    );
  };

  getMonthlyCompletedProcurementReport = async (c: Context<AppContext>) => {
    const query = MonthlyCompletedProcurementQuerySchema.parse(c.req.query());
    const { tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    return c.json({
      success: true,
      report: await this.service.getMonthlyCompletedProcurementReport({
        tenant_id,
        company_id,
        query,
      }),
    });
  };

  getApprovedPurchaseRequisition = async (c: Context<AppContext>) => {
    const query = ProcurementQueueQuerySchema.parse(c.req.query());
    const { tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const ApprovedPR = await this.service.getProcurementQueue({
      tenant_id,
      company_id,
      query,
    });

    return c.json(
      {
        success: true,
        message: "Success list is returned",
        ApprovedPR,
      },
      200,
    );
  };

  getRfqs = async (c: Context<AppContext>) => {
    const query = ListRFQsQuerySchema.parse(c.req.query());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      query,
    };

    const list = await this.service.getRFQS(input);
    const total = await this.service.countRFQS(input);

    return c.json(
      {
        success: true,
        list,
        total,
      },
      200,
    );
  };

  getQuotationList = async (c: Context<AppContext>) => {
    const params = RFQIdParamsSchema.parse(c.req.param());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      params,
    };

    const QuotationList = await this.service.getQuotationList(input);

    return c.json(
      {
        success: true,
        QuotationList,
      },
      200,
    );
  };

  getAllQuotations = async (c: Context<AppContext>) => {
    const { tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const quotations = await this.service.getAllQuotations({
      tenant_id,
      company_id,
    });

    return c.json({ success: true, ...quotations }, 200);
  };

  getQuotation = async (c: Context<AppContext>) => {
    const params = QuotationParamsSchema.parse(c.req.param());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      params,
    };

    const Quotation = await this.service.getQuotation(input);

    return c.json(
      {
        success: true,
        Quotation,
      },
      200,
    );
  };

  getPO = async (c: Context<AppContext>) => {
    const params = PurchaseOrderIdParamsSchema.parse(c.req.param());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      params,
    };

    const PO = await this.service.getPO(input);

    return c.json(
      {
        success: true,
        PO,
      },
      200,
    );
  };

  updateRfq = async (c: Context<AppContext>) => {
    const params = RFQIdParamsSchema.parse(c.req.param());

    const body = UpdateRFQSchema.parse(await c.req.json());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      params,
      body,
    };

    const updated = await this.service.updateRFQS(input);

    return c.json(
      {
        success: true,
        message: "Sucessful",
        updated,
      },
      200,
    );
  };

  updatePo = async (c: Context<AppContext>) => {
    const params = PurchaseOrderIdParamsSchema.parse(c.req.param());

    const body = UpdatePurchaseOrderSchema.parse(await c.req.json());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      body,
      params,
    };

    const updated = await this.service.updatePO(input);

    return c.json(
      {
        success: true,
        updated,
      },
      200,
    );
  };

  deleteRfq = async (c: Context<AppContext>) => {
    const params = RFQIdParamsSchema.parse(c.req.param());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      params,
    };

    const deleted = await this.service.deleteRfq(input);

    return c.json(
      {
        success: true,
        deleted,
      },
      200,
    );
  };

  deletePurchaseOrder = async (c: Context<AppContext>) => {
    const params = PurchaseOrderIdParamsSchema.parse(c.req.param());

    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      params,
    };

    const deletedPO = await this.service.deletePurchaseOrder(input);

    return c.json(
      {
        success: true,
        deletedPO,
      },
      200,
    );
  };
}
