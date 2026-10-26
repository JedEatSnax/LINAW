import type { AppContext } from "../../shared/types/hono.js";
import { Context } from "hono";
import { purchaseRequisitionService } from "./purchaseRequisitionService.js";
import type {
  PurchaseRequisitionIdParams,
  PurchaseRequisitionInput,
  CancelPurchaseRequisitionInput,
  ResubmitPurchaseRequisitionInput,
  PurchaseRequisitionQuery,
} from "./purchaseRequisitionValidation.js";

import {
  PurchaseRequisitionQuerySchema,
  updatePurchaseRequisitionSchema,
  cancelPurchaseRequisitionSchema,
  purchaseRequisitionInputSchema,
  purchaseRequisitionIdParamsSchema,
} from "./purchaseRequisitionValidation.js";
import { UnauthorizedAccessError } from "../../shared/errors/appError.js";

function requisitionSummary(requisition: {
  id: string;
  pr_number: string;
  status: string;
  workflow_code: string | null;
  total_amount: unknown;
  currency_code: string;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    requisition_id: requisition.id,
    requisition_number: requisition.pr_number,
    requisition_status: requisition.status,
    workflow_code: requisition.workflow_code,
    total_estimated_amount: requisition.total_amount,
    currency_code: requisition.currency_code,
    created_at: requisition.created_at,
    updated_at: requisition.updated_at,
  };
}

function authenticatedCompanyId(c: Context<AppContext>): string {
  const companyId = c.get("user").company_id;

  if (!companyId) {
    throw new UnauthorizedAccessError("Company context is required");
  }

  return companyId;
}

export class PurchaseRequisitionController {
  constructor(private service: purchaseRequisitionService) {
    this.service = service;
  }

  createRequisition = async (c: Context<AppContext>): Promise<Response> => {
    if (!c.get("user").user_id) {
      throw new UnauthorizedAccessError("Authentication required");
    }
    const requisition = purchaseRequisitionInputSchema.parse(
      await c.req.json(),
    );

    const userId = c.get("user").user_id;

    const tenantId = c.get("user").tenant_id;
    const companyId = authenticatedCompanyId(c);

    const purchaseRequisition: PurchaseRequisitionInput = {
      ...requisition,
      userId,
      tenantId,
      companyId,
    };

    const creation = await this.service.createRequisition(purchaseRequisition);

    return c.json(
      {
        success: true,
        message: "Purchase requisition created successfully.",
        data: requisitionSummary(creation),
      },
      201,
    );
  };

  submitRequisition = async (c: Context<AppContext>): Promise<Response> => {
    const params = purchaseRequisitionIdParamsSchema.parse(c.req.param());

    const submitRequisition: PurchaseRequisitionIdParams = {
      requisitionId: params.requisitionId,
      userId: c.get("user").user_id,
      tenantId: c.get("user").tenant_id,
      companyId: authenticatedCompanyId(c),
    };

    const submit = await this.service.submitRequisition(submitRequisition);

    return c.json(
      {
        success: true,
        message: "Purchase requisition submitted successfully.",
        data: {
          requisition_id: submit.requisition_id,
          requisition_status: submit.requisition_status,
          submitted_at: submit.submitted_at,
        },
      },
      200,
    );
  };

  cancelRequisition = async (c: Context<AppContext>): Promise<Response> => {
    const cancellation = cancelPurchaseRequisitionSchema.parse(
      await c.req.json(),
    );

    const params = purchaseRequisitionIdParamsSchema.parse(c.req.param());

    const cancelRequisition: CancelPurchaseRequisitionInput = {
      ...cancellation,
      requisitionId: params.requisitionId,
      userId: c.get("user").user_id,
      tenantId: c.get("user").tenant_id,
      companyId: authenticatedCompanyId(c),
    };

    const cancel = await this.service.cancelRequisition(cancelRequisition);

    return c.json(
      {
        success: true,
        message: "Purchase resquisition cancelled successfully.",
        data: cancel,
      },
      200,
    );
  };

  resubmitRequisition = async (c: Context<AppContext>): Promise<Response> => {
    const params = purchaseRequisitionIdParamsSchema.parse(c.req.param());

    const retryRequisition = purchaseRequisitionInputSchema.parse(
      await c.req.json(),
    );

    const resubmit: ResubmitPurchaseRequisitionInput = {
      ...retryRequisition,
      requisitionId: params.requisitionId,
      userId: c.get("user").user_id,
      tenantId: c.get("user").tenant_id,
      companyId: authenticatedCompanyId(c),
    };

    const resubmitRequisition =
      await this.service.resubmitRequisition(resubmit);

    return c.json(
      {
        success: true,
        message: "Purchase requisition successfully submitted",
        data: {
          requisition_id: resubmitRequisition.requisition_id,
          requisition_status: resubmitRequisition.requisition_status,
          submitted_at: resubmitRequisition.submitted_at,
        },
      },
      200,
    );
  };

  requisition = async (c: Context<AppContext>) => {
    const query = PurchaseRequisitionQuerySchema.parse(c.req.query());

    const user = c.get("user");

    const data: PurchaseRequisitionQuery = {
      userId: user.user_id,
      tenantId: user.tenant_id,
      companyId: authenticatedCompanyId(c),
      status: query.status,
      requesterId: query.requesterId,
      pr_number: query.pr_number,
    };

    const requisition = await this.service.getRequisition(data);
    const total = await this.service.countRequisition(data);

    return c.json(
      {
        success: true,
        message: "Purchase requisitions retrieved successfully.",
        data: {
          purchase_requisitions: requisition.map(requisitionSummary),
          total,
        },
      },
      200,
    );
  };

  details = async (c: Context<AppContext>): Promise<Response> => {
    const params = purchaseRequisitionIdParamsSchema.parse(c.req.param());

    const requisitionDetails: PurchaseRequisitionIdParams = {
      requisitionId: params.requisitionId,
      userId: c.get("user").user_id,
      tenantId: c.get("user").tenant_id,
      companyId: authenticatedCompanyId(c),
    };

    const details =
      await this.service.purchaseRequisitionDetail(requisitionDetails);

    return c.json(
      {
        success: true,
        message: "Purchase requisition retrieved successfully.",
        data: details
          ? {
              ...details,
              requisition_id: details.id,
              requisition_number: details.pr_number,
              requester_id: details.requested_by_user_id,
              requisition_status: details.status,
              line_items: details.items,
            }
          : details,
      },
      200,
    );
  };

  update = async (c: Context<AppContext>): Promise<Response> => {
    const body = await c.req.json();
    const updateContent = updatePurchaseRequisitionSchema.parse(body);

    const params = purchaseRequisitionIdParamsSchema.parse(c.req.param());

    const updateReqs = await this.service.updateRequisition(
      params.requisitionId,
      c.get("user").user_id,
      c.get("user").tenant_id,
      authenticatedCompanyId(c),
      updateContent,
    );

    return c.json(
      {
        success: true,
        message: "Purchase requisition updated successfully.",
        data: requisitionSummary(updateReqs),
      },
      200,
    );
  };
}
