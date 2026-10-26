import { z } from "zod";

// =========
// search audit schema
// =========

export const searchAuditSchema = z.object({
  audit_id: z.string().uuid(),
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

// =========
// audit integrity schema
// =========

export const auditIntegritySchema = z.object({
  audit_id: z.string().uuid(),
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

export const listAuditSchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
  entity_type: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  result: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(25),
});

// =========
// Interface
// =========

export type searchAudit = z.infer<typeof searchAuditSchema>;

export type auditIntegrity = z.infer<typeof auditIntegritySchema>;

export type listAudit = z.infer<typeof listAuditSchema>;
