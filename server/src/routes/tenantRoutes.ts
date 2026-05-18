import { Router } from "express";
import {
  createTenant,
  deleteTenant,
  getTenant,
  getTLSCert,
  listTenants,
} from "../controllers/tenantController.js";

export const tenantRouter = Router();

tenantRouter.post("/", createTenant);
tenantRouter.get("/", listTenants);
tenantRouter.get("/:tenantId", getTenant);
tenantRouter.get("/:tenantId/tls-cert", getTLSCert);
tenantRouter.delete("/:tenantId", deleteTenant);
