import type { AppContext } from "../../shared/types/hono.js";
import { Context } from "hono";
import { ApprovalWorkflowService } from "./approvalWorkflowService.js";
import {
  APPROVAL_WORKFLOW_ID_PARAMS_SCHEMA,
  REJECT_APPROVAL_WORKFLOW_BODY_SCHEMA,
  APPROVAL_WORKFLOW_LEVEL_CREATION,
  APPROVAL_WORKFLOW_CREATION,
} from "./approvalWorkflowValidator.js";

import type { CreateWorkflow } from "./approvalWorkflowValidator.js";
import { APPROVAL_WORKFLOW_QUERY_SCHEMA } from "./approvalWorkflowValidator.js";

import { UnauthorizedAccessError } from "../../shared/errors/";

export class ApprovalWorkflowController {
  constructor(private service: ApprovalWorkflowService) {}

  approve = async (c: Context<AppContext>): Promise<Response> => {
    const { approvalWorkflowId } = APPROVAL_WORKFLOW_ID_PARAMS_SCHEMA.parse(
      c.req.param(),
    );

    const { user_id, company_id } = c.var.user;

    if (!company_id) {
      throw new UnauthorizedAccessError("Company context is required.");
    }

    const data = {
      approvalWorkflow_id: approvalWorkflowId,
      user_id,
    };

    const approved = await this.service.approveRequest(data);

    return c.json(
      {
        success: true,
        data: approved,
      },
      200,
    );
  };

  reject = async (c: Context<AppContext>): Promise<Response> => {
    const params = APPROVAL_WORKFLOW_ID_PARAMS_SCHEMA.parse(c.req.param());

    const body = REJECT_APPROVAL_WORKFLOW_BODY_SCHEMA.parse(await c.req.json());

    const { user_id, company_id } = c.var.user;

    if (!company_id) {
      throw new UnauthorizedAccessError("Company context is required.");
    }

    const data = {
      user_id: user_id,
      remarks: body.remarks,
      approvalWorkflow_id: params.approvalWorkflowId,
    };

    const rejected = await this.service.rejectRequest(data);

    return c.json(
      {
        success: true,
        data: rejected,
      },
      200,
    );
  };

  cancel = async (c: Context<AppContext>): Promise<Response> => {
    const params = APPROVAL_WORKFLOW_ID_PARAMS_SCHEMA.parse(c.req.param());

    const { user_id, company_id } = c.var.user;

    if (!company_id) {
      throw new UnauthorizedAccessError("Company context is required.");
    }

    const data = {
      approvalWorkflow_id: params.approvalWorkflowId,
      user_id: user_id,
    };

    const cancelled = await this.service.cancelRequest(data);

    return c.json(
      {
        success: true,
        data: cancelled,
      },
      200,
    );
  };

  approvalWorkflow = async (c: Context<AppContext>) => {
    const { user_id, company_id } = c.var.user;

    if (!company_id) {
      throw new UnauthorizedAccessError("Company context is required.");
    }

    const query = APPROVAL_WORKFLOW_QUERY_SCHEMA.parse(c.req.query());
    const data = { userId: user_id, status: query.status };

    const getApprovalWorkflows = await this.service.getApprovalWorkflows(data);
    const total = await this.service.countApprovalWorkflows(data);

    return c.json(
      {
        success: true,
        data: {
          approval_requests: getApprovalWorkflows,
          total,
        },
      },
      200,
    );
  };

  approvalRequest = async (c: Context<AppContext>): Promise<Response> => {
    const { approvalWorkflowId } = APPROVAL_WORKFLOW_ID_PARAMS_SCHEMA.parse(
      c.req.param(),
    );

    const { user_id, company_id } = c.var.user;

    if (!company_id) {
      throw new UnauthorizedAccessError("Company context is required.");
    }

    const data = {
      userId: user_id,
      approvalWorkflowId,
    };

    const request = await this.service.approvalRequest(data);

    return c.json(
      {
        success: true,
        data: request,
      },
      200,
    );
  };

  createLevels = async (c: Context<AppContext>): Promise<Response> => {
    const body = APPROVAL_WORKFLOW_LEVEL_CREATION.parse(await c.req.json());

    const { user_id, company_id } = c.var.user;

    if (!company_id) {
      throw new UnauthorizedAccessError("Company context is required.");
    }

    const data = {
      ...body,
      userId: user_id,
    };

    const level = await this.service.createLevel(data);

    return c.json(
      {
        success: true,
        data: level,
      },
      200,
    );
  };

  createWorkflowDefinition = async (
    c: Context<AppContext>,
  ): Promise<Response> => {
    const body = APPROVAL_WORKFLOW_CREATION.parse(await c.req.json());

    const { user_id, company_id } = c.var.user;

    if (!company_id) {
      throw new UnauthorizedAccessError("Company context is required.");
    }

    const data: CreateWorkflow = {
      ...body,
      userId: user_id,
    };

    const workflow = await this.service.createWorkflowDefinition(data);

    return c.json(
      {
        success: true,
        data: workflow,
      },
      200,
    );
  };

  workflowCodes = async (c: Context<AppContext>): Promise<Response> => {
    const { user_id, company_id } = c.var.user;

    if (!company_id) {
      throw new UnauthorizedAccessError("Company context is required.");
    }

    const data = {
      userId: user_id,
    };

    const getCodes = await this.service.workflowCodes(data);

    return c.json(
      {
        success: true,
        data: getCodes,
      },
      200,
    );
  };
}
