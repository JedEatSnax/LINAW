import { z } from "zod";

export const SupplierIdSchema = z.object({
  supplierId: z.uuid("Invalid supplier ID."),
});

export type SupplierIdParams = z.infer<typeof SupplierIdSchema>;

export const SupplierQuerySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  status: z.string().trim().min(1).max(32).optional(),
  relationship_status: z.string().trim().min(1).max(32).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SupplierQuery = z.infer<typeof SupplierQuerySchema>;
