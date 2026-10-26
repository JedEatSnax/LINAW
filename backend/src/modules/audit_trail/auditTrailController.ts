import type { AppContext } from "../../shared/types/hono.js";
import { Context } from "hono";
import { AuditTrailService } from "./auditTrailService.js";
import {
  listAuditSchema,
  searchAuditSchema,
  auditIntegritySchema,
} from "./auditTrailValidator.js";
import { NotFoundError } from "../../shared/errors/appError.js";

export class auditTrailController {
  constructor(private readonly service: AuditTrailService) {}

  listAuditRecords = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const data = listAuditSchema.parse({
      ...c.req.query(),
      user_id,
      tenant_id,
      company_id,
    });
    const auditTrails = await this.service.listAudits(data);

    return c.json(
      {
        success: true,
        message: "Audit trails retrieved successfully",
        data: auditTrails,
      },
      200,
    );
  };

  searchAuditRecord = async (c: Context<AppContext>): Promise<Response> => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const search = {
      ...c.req.query(),
      user_id,
      tenant_id,
      company_id,
    };
    const validatedSearch = searchAuditSchema.parse(search);
    const id = await this.service.searchAudit(validatedSearch);

    return c.json(
      {
        success: true,
        message: "Purchase Order Found",
        data: id,
      },
      200,
    );
  };

  verifyAuditIntegrity = async (c: Context<AppContext>): Promise<Response> => {
    const { user_id, tenant_id, company_id } = c.get("user");

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const verify = auditIntegritySchema.parse({
      audit_id: c.req.param("auditId"),
      user_id,
      tenant_id,
      company_id,
    });

    const data = await this.service.auditIntegrity(verify);

    return c.json(
      {
        success: true,
        data: data,
      },
      200,
    );
  };
}
