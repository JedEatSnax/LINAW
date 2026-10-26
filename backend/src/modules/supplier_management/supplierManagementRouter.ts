import { Hono } from "hono";
import type { AppContext } from "../../shared/types/hono.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { Authorize } from "../../shared/Authorization/authorize.js";
import { systemPermissions } from "../../shared/Authorization/seeds/systemPermissions.js";
import { SupplierManagementGovernanceController } from "./SupplierManagementGovernance/supplierManagementGovernanceController.js";
import { SupplierManagementGovernanceService } from "./SupplierManagementGovernance/supplierManagementGovernanceService.js";
import { SupplierManagementGovernanceRepository } from "./SupplierManagementGovernance/supplierManagementGovernanceRepository.js";
import { SupplierManagementInvitationController } from "./SupplierManagementInvitation/supplierManagementInvitationController.js";
import { SupplierManagementInvitationService } from "./SupplierManagementInvitation/supplierManagementInvitationService.js";
import { SupplierManagementInvitationRepository } from "./SupplierManagementInvitation/supplierManagementInvitationRepository.js";
import { SupplierManagementPortalController } from "./supplierManagementPortal/supplierManagementPortalController.js";
import { SupplierManagementPortalService } from "./supplierManagementPortal/supplierManagementPortalService.js";
import { SupplierManagementPortalRepository } from "./supplierManagementPortal/supplierManagementPortalRepository.js";
import { eventBus } from "../../shared/events/eventBus.js";

export function createSupplierManagement() {
  const router = new Hono<AppContext>();

  const governanceService = new SupplierManagementGovernanceService(
    new SupplierManagementGovernanceRepository(),
  );

  const invitationService = new SupplierManagementInvitationService(
    new SupplierManagementInvitationRepository(),
  );

  const portalService = new SupplierManagementPortalService(
    new SupplierManagementPortalRepository(),
    eventBus,
  );

  const governanceController = new SupplierManagementGovernanceController(
    governanceService,
  );

  const invitationController = new SupplierManagementInvitationController(
    invitationService,
  );

  const portalController = new SupplierManagementPortalController(
    portalService,
  );

  router.get(
    "/supplier-invitations/validate/:token",
    invitationController.validateInvitation,
  );

  router.use("*", authenticate);

  // ==========================================
  // SUPPLIER GOVERNANCE
  // ==========================================

  // GET
  router.get(
    "/suppliers-governance",
    Authorize(systemPermissions.supplierManagement.read),
    governanceController.getSuppliers,
  );
  router.get(
    "/suppliers-governce/:supplierId",
    Authorize(systemPermissions.supplierManagement.readSupplier),
    governanceController.getSupplier,
  );

  // DELETE
  router.delete(
    "/suppliers-governance/:supplierId/relationship",
    Authorize(systemPermissions.supplierManagement.removeSupplier),
    governanceController.removeSupplierRelationship,
  );

  // ==========================================
  // SUPPLIER INVITATIONS
  // ==========================================

  // POST
  router.post(
    "/supplier-invitations",
    Authorize(systemPermissions.supplierManagement.inviteSupplier),
    invitationController.createInvitation,
  );
  router.post(
    "/supplier-invitations/:invitationId/resend",
    Authorize(systemPermissions.supplierManagement.inviteSupplier),
    invitationController.MailgunInvitation,
  );
  router.post(
    "/supplier-invitations/:invitationId/accept",
    Authorize(systemPermissions.supplierManagement.read),
    invitationController.acceptInvitation,
  );

  // GET
  router.get(
    "/supplier-invitations",
    Authorize(systemPermissions.supplierManagement.read),
    invitationController.getInvitations,
  );

  router.get(
    "/supplier-invitations/:invitationId",
    Authorize(systemPermissions.supplierManagement.read),
    invitationController.getInvitation,
  );

  // ==========================================
  // SUPPLIER PORTAL
  // ==========================================

  // GET
  router.get(
    "/supplier-portal/rfqs",
    Authorize(systemPermissions.supplier.readRFQ),
    portalController.getAvailableRFQs,
  );
  router.get(
    "/supplier-portal/rfqs/:rfqId",
    Authorize(systemPermissions.supplier.readRFQ),
    portalController.getRFQ,
  );
  router.get(
    "/supplier-portal/quotations",
    Authorize(systemPermissions.supplier.read),
    portalController.getQuotations,
  );
  router.get(
    "/supplier-portal/quotations/:quotationId",
    Authorize(systemPermissions.supplier.read),
    portalController.getQuotation,
  );

  // POST
  router.post(
    "/supplier-portal/rfqs/:rfqId/quotations",
    Authorize(systemPermissions.supplier.submitQuotation),
    portalController.submitQuotation,
  );

  return router;
}
