import type { AppContext } from "../../shared/types/hono.js";
import { Hono } from "hono";
import { authenticate } from "../../shared/middleware/authenticate";
import { Authorize } from "../../shared/Authorization/authorize";
import { systemPermissions } from "../../shared/Authorization/seeds/systemPermissions";
import { OrganizationAdministrationController } from "./organizationAdministratorController";
import { OrganizationAdministrationService } from "./organizationAdministrationService";
import { OrganizationAdministrationRepository } from "./organizationAdministrationRepository";

export function createOrganizationAdministration() {
  const router = new Hono<AppContext>();
  const service = new OrganizationAdministrationService(
    new OrganizationAdministrationRepository(),
  );
  const controller = new OrganizationAdministrationController(service);

  router.get("/members/validate/:token", controller.validateInvitation);

  router.use(authenticate);

  // Organization Member Management

  router.post(
    "/members",
    Authorize(systemPermissions.organizationManagement.inviteMember),
    controller.addMember,
  );
  router.post(
    "/members/accept",
    Authorize(systemPermissions.organizationManagement.readMember),
    controller.acceptInvitation,
  );

  router.get(
    "/members",
    Authorize(systemPermissions.organizationManagement.readMember),
    controller.getMember,
  );
  router.get(
    "/members/:userId",
    Authorize(systemPermissions.organizationManagement.readMember),
    controller.getUser,
  );

  router.patch(
    "/members/:userId",
    Authorize(systemPermissions.organizationManagement.updateMember),
    controller.updateMember,
  );

  router.delete(
    "/members/:userId",
    Authorize(systemPermissions.organizationManagement.removeMember),
    controller.removeMember,
  );

  // Organizatoin Role & Permission Management

  router.post(
    "/roles",
    Authorize(systemPermissions.organizationManagement.createRole),
    controller.role,
  );
  router.post(
    "/members/:userId/roles",
    Authorize(systemPermissions.organizationManagement.updateMember),
    controller.assignRoleToMember,
  );
  router.post(
    "/roles/:roleId/permissions",
    Authorize(systemPermissions.organizationManagement.addRolePermission),
    controller.assignPermissionsToRole,
  );

  router.get(
    "/roles",
    Authorize(systemPermissions.organizationManagement.readRole),
    controller.getRoles,
  );
  router.get(
    "/roles/:roleId",
    Authorize(systemPermissions.organizationManagement.readRole),
    controller.getRole,
  );
  router.get(
    "/roles/:roleId/permissions",
    Authorize(systemPermissions.organizationManagement.readRole),
    controller.getRolePermissions,
  );
  router.get(
    "/permissions",
    Authorize(systemPermissions.organizationManagement.readRole),
    controller.getPermissions,
  );

  router.patch(
    "/roles/:roleId",
    Authorize(systemPermissions.organizationManagement.updateRole),
    controller.updateRole,
  );

  router.delete(
    "/roles/:roleId",
    Authorize(systemPermissions.organizationManagement.deleteRole),
    controller.deleteRole,
  );
  router.delete(
    "/roles/:roleId/permissions/:permissionId",
    Authorize(systemPermissions.organizationManagement.removeRolePermission),
    controller.deletePermissionsFromRole,
  );
  router.delete(
    "/members/:userId/roles/:roleId",
    Authorize(systemPermissions.organizationManagement.updateMember),
    controller.removeRoleFromMember,
  );

  // Organization Settings

  router.get(
    "/settings",
    Authorize(systemPermissions.organizationManagement.read),
    controller.settings,
  );
  router.patch(
    "/settings",
    Authorize(systemPermissions.organizationManagement.update),
    controller.updateSettings,
  );

  // Administrative Audit trail

  //router.get("/audit-trail", controller.auditTrail)

  return router;
}
