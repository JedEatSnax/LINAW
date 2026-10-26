import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import type { AppContext } from "./shared/types/hono.js";
import type { AppEnv } from "./config/env.js";
import {
  disposePrisma,
  initializePrisma,
  runWithPrisma,
} from "./config/database.js";

import { errorHandler } from "./shared/middleware/errorHandler.js";

import { createAuthRouter } from "./modules/authentication/authRouter.js";
import { createAuditRouter } from "./modules/audit_trail/auditTrailRouter.js";
import { createApprovalWorkflow } from "./modules/approval_workflow/approvalWorkflowRouter.js";
import { createPurchaseRequistionRouter } from "./modules/purchase_requisition/purchaseRequisitionRouter.js";
import { createOrganizationAdministration } from "./modules/organization_administration/organizationAdministrationRouter.js";
import { createPurchaseOrderManagement } from "./modules/purchase_order_management/purchaseOrderManagementRouter.js";
import { createUserManagementRouter } from "./modules/user_management/userManagementRouter.js";
import { createSupplierManagement } from "./modules/supplier_management/supplierManagementRouter.js";

import { AuditTrailRepository } from "./modules/audit_trail/auditTrailRepository.js";
import { AuditTrailService } from "./modules/audit_trail/auditTrailService.js";
import { registerAuditTrailEvents } from "./modules/audit_trail/auditTrailEventHandler.js";
import { BlockchainAdapter } from "./shared/blockchain/blockchainAdapter.js";

const app = new Hono<AppContext>().basePath("/api");

app.use(
  "*",
  cors({
    origin: (origin, c: Context<AppContext>) =>
      origin === c.env.ALLOWED_ORIGIN ? origin : "",
  }),
);

app.use("*", secureHeaders());
app.use("*", logger());

app.onError(errorHandler);

app.get("/health", (c: Context<AppContext>) => {
  return c.json({
    success: true,
    message: "LINAW API is running",
  });
});

app.all("*", async (c: Context<AppContext>) => {
  const env = c.env as AppEnv;

  const prisma = initializePrisma(env);

  try {
    const blockchainAdapter = new BlockchainAdapter(env);
    const repository = new AuditTrailRepository();
    const service = new AuditTrailService(repository, blockchainAdapter);
    registerAuditTrailEvents(service);

    const authRouter = createAuthRouter(env);
    const auditRouter = createAuditRouter(service);
    const approvalWorkflowRouter = createApprovalWorkflow();
    const purchaseRequisitionRouter = createPurchaseRequistionRouter();
    const organizationAdministrationRouter = createOrganizationAdministration();
    const purchaseOrderManagementRouter = createPurchaseOrderManagement();
    const supplierManagementRouter = createSupplierManagement();
    const userManagementRouter = createUserManagementRouter();

    const router = new Hono<AppContext>();
    router.onError(errorHandler);

    router.route("/auth", authRouter);
    router.route("/auditTrail", auditRouter);
    router.route("/approval-workflows", approvalWorkflowRouter);
    router.route("/PurchaseRequisition", purchaseRequisitionRouter);
    router.route("/organizationManagement", organizationAdministrationRouter);
    router.route("/purchase-orders", purchaseOrderManagementRouter);
    router.route("/suppliers", supplierManagementRouter);
    router.route("/userManagementRouter", userManagementRouter);

    const forwardedUrl = new URL(c.req.url);
    forwardedUrl.pathname =
      forwardedUrl.pathname.replace(/^\/api(?=\/|$)/, "") || "/";

    const forwardedRequest = new Request(forwardedUrl, c.req.raw);

    return await runWithPrisma(prisma, () =>
      router.fetch(forwardedRequest, c.env),
    );
  } finally {
    await disposePrisma(prisma);
  }
});

export default app;
