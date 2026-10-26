import type { AppContext } from "../../../shared/types/hono.js";
import type { Context } from "hono";

import {
  AcceptSupplierInvitationSchema,
  CreateSupplierInvitationSchema,
  InvitationIdSchema,
  InvitationQuerySchema,
  InvitationTokenSchema,
} from "./supplierManagementInvitationValidator.js";
import type { SupplierManagementInvitationService } from "./supplierManagementInvitationService.js";
import { NotFoundError } from "../../../shared/errors/";

export class SupplierManagementInvitationController {
  constructor(private service: SupplierManagementInvitationService) {}

  // Create Supplier Invitation
  createInvitation = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.get("user");

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const { email } = CreateSupplierInvitationSchema.parse(await c.req.json());

    const invitation = {
      user_id,
      tenant_id,
      company_id,
      email,
    };

    const createdInvitation = await this.service.createInvitation(invitation);
    const sentInvitation = await this.service.sendInvitation(
      {
        user_id,
        tenant_id,
        company_id,
        invitation_id: createdInvitation.id,
      },
      c.env,
    );

    return c.json(
      {
        success: true,
        message: "Supplier invitation created successfully.",
        data: sentInvitation,
      },
      201,
    );
  };

  getInvitations = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const query = InvitationQuerySchema.parse(c.req.query());
    const input = {
      user_id,
      tenant_id,
      company_id,
      ...query,
    };

    const Invitations = await this.service.getInvitations(input);

    return c.json({
      success: true,
      message: "Supplier invitations retrieved successfully.",
      data: Invitations,
    });
  };

  // Get Supplier Invitation
  getInvitation = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.get("user");

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const { invitationId } = InvitationIdSchema.parse({
      invitationId: c.req.param("invitationId"),
    });

    const invitation = {
      user_id,
      tenant_id,
      company_id,
      invitation_id: invitationId,
    };

    const result = await this.service.getInvitation(invitation);

    return c.json(
      {
        success: true,
        message: "Supplier invitation retrieved successfully.",
        data: result,
      },
      200,
    );
  };

  // Mailgun Supplier Invitation
  MailgunInvitation = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.get("user");

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const { invitationId } = InvitationIdSchema.parse({
      invitationId: c.req.param("invitationId"),
    });

    const invitation = {
      user_id,
      tenant_id,
      company_id,
      invitation_id: invitationId,
    };

    const invitationSent = await this.service.sendInvitation(invitation, c.env);

    return c.json(
      {
        success: true,
        message: "Supplier invitation resend requested.",
        data: invitationSent,
      },
      200,
    );
  };

  // Validate Supplier Invitation Token
  validateInvitation = async (c: Context<AppContext>) => {
    const { token } = InvitationTokenSchema.parse({
      token: c.req.param("token"),
    });

    const invitation = await this.service.validateInvitation({ token });

    return c.json(
      {
        success: true,
        message: "Supplier invitation is valid.",
        data: invitation,
      },
      200,
    );
  };

  // Accept Supplier Invitation
  acceptInvitation = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id: activeCompanyId } = c.get("user");

    const { invitationId } = InvitationIdSchema.parse({
      invitationId: c.req.param("invitationId"),
    });

    const body = AcceptSupplierInvitationSchema.parse(await c.req.json());
    const invitation = {
      user_id,
      tenant_id,
      company_id: body.company_id ?? activeCompanyId,
      token: body.token,
      invitation_id: invitationId,
    };

    const acceptedInvitation = await this.service.acceptInvitation(invitation);

    return c.json(
      {
        success: true,
        message: "Supplier invitation accepted successfully.",
        data: acceptedInvitation,
      },
      200,
    );
  };
}
