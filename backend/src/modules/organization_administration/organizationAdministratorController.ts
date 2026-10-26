import type { AppContext } from "../../shared/types/hono.js";
import {
  NotFoundError,
  RequestDataError,
} from "../../shared/errors/appError.js";
import { Context } from "hono";
import { OrganizationAdministrationService } from "./organizationAdministrationService";
import {
  assignPermissionsSchema,
  updateRoleSchema,
  assignRoleSchema,
  createRoleSchema,
  memberEmailSchema,
  updateMemberSchema,
  updateSettingsSchema,
  invitationTokenSchema,
} from "./organizationAdministrationValidator";

export class OrganizationAdministrationController {
  constructor(private service: OrganizationAdministrationService) {}

  addMember = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const { email } = memberEmailSchema.parse(await c.req.json());

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const inviteMember = {
      user_id,
      tenant_id,
      company_id,
      email,
    };

    const member = await this.service.addMember(inviteMember, c.env);

    return c.json(
      {
        success: true,
        message: "invitation sent",
        member,
      },
      200,
    );
  };

  validateInvitation = async (c: Context<AppContext>) => {
    const { token } = invitationTokenSchema.parse({
      token: c.req.param("token"),
    });
    const data = await this.service.validateInvitation(token);

    return c.json(
      { success: true, message: "Invitation is valid", data },
      200,
    );
  };

  acceptInvitation = async (c: Context<AppContext>) => {
    const { user_id, tenant_id } = c.var.user;
    const { token } = invitationTokenSchema.parse(await c.req.json());
    const user = await this.service.getUserIdentity(user_id, tenant_id);

    if (!user) throw new NotFoundError("User not found");

    const data = await this.service.acceptInvitation({
      user_id,
      tenant_id,
      email: user.email,
      token,
    });

    return c.json(
      { success: true, message: "Invitation accepted", data },
      200,
    );
  };

  getMember = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const getMember = {
      user_id,
      tenant_id,
      company_id,
    };

    const memberList = await this.service.getMember(getMember);

    return c.json(
      {
        success: true,
        message: "successfully retrieved list",
        memberList,
      },
      200,
    );
  };

  getUser = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;
    const target_user_id = c.req.param("userId");

    if (!target_user_id) {
      throw new RequestDataError("User ID is required", 400);
    }

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const getUser = {
      user_id,
      tenant_id,
      company_id,
      target_user_id,
    };

    const user = await this.service.getUser(getUser);

    return c.json(
      {
        success: true,
        message: "User retrieved",
        user,
      },
      200,
    );
  };

  updateMember = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const target_user_id = c.req.param("userId");
    const update = updateMemberSchema.parse(await c.req.json());

    if (!target_user_id) {
      throw new RequestDataError("User ID is required", 400);
    }

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      target_user_id,
      update,
    };

    const updated = await this.service.updateMember(input);

    return c.json(
      {
        success: true,
        message: " Successfully updated user ",
        updated,
      },
      200,
    );
  };

  removeMember = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;
    const target_user_id = c.req.param("userId");

    if (!target_user_id) {
      throw new RequestDataError("User ID is required", 400);
    }

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const removeMember = {
      user_id,
      tenant_id,
      company_id,
      target_user_id,
    };

    const removed = await this.service.removeMember(removeMember);

    return c.json(
      {
        success: true,
        message: "Successfully remove user",
        removed,
      },
      200,
    );
  };

  role = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const role = createRoleSchema.parse(await c.req.json());

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const createRole = {
      user_id,
      tenant_id,
      company_id,
      role,
    };

    const createdRole = await this.service.role(createRole);

    return c.json(
      {
        success: true,
        message: "Successfully created role",
        createdRole,
      },
      201,
    );
  };

  assignRoleToMember = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const member_user_id = c.req.param("userId");
    const assignRole = assignRoleSchema.parse(await c.req.json());

    if (!member_user_id) {
      throw new RequestDataError("User ID is required", 400);
    }

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      member_user_id,
      assignRole,
    };

    const assigned = await this.service.assignRoleToMember(input);

    return c.json(
      {
        success: true,
        message: "Successfully assigned role to member",
        assigned,
      },
      200,
    );
  };

  assignPermissionsToRole = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const role_id = c.req.param("roleId");

    if (!role_id) {
      throw new RequestDataError("Role ID is required", 400);
    }

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const permissions = assignPermissionsSchema.parse(await c.req.json());

    const input = {
      user_id,
      tenant_id,
      company_id,
      role_id,
      permissions,
    };

    const updated = await this.service.assignPermissionsToRole(input);

    return c.json(
      {
        success: true,
        message: "Successfully assigned permissions to role",
        updated,
      },
      200,
    );
  };

  getRoles = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
    };

    const roles = await this.service.getRoles(input);

    return c.json(
      {
        success: true,
        message: "Successfully retrieved roles",
        roles,
      },
      200,
    );
  };

  getRole = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const role_id = c.req.param("roleId");

    if (!role_id) {
      throw new RequestDataError("Role ID is required", 400);
    }

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      role_id,
    };

    const role = await this.service.getRole(input);

    return c.json(
      {
        success: true,
        message: "Successfully retrieved role",
        role,
      },
      200,
    );
  };

  getRolePermissions = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const role_id = c.req.param("roleId");

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    if (!role_id) {
      throw new RequestDataError("Role ID is required", 400);
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      role_id,
    };

    const permissions = await this.service.getRolePermissions(input);

    return c.json(
      {
        success: true,
        message: "Successfully retrieved role permissions",
        permissions,
      },
      200,
    );
  };

  getPermissions = async (c: Context<AppContext>) => {
    const permissions = await this.service.getPermissions();

    return c.json(
      {
        success: true,
        message: "Successfully retrieved permissions",
        permissions,
      },
      200,
    );
  };

  updateRole = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const role_id = c.req.param("roleId");

    if (!role_id) {
      throw new RequestDataError("Role ID is required", 400);
    }

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const update = updateRoleSchema.parse(await c.req.json());

    const input = {
      user_id,
      tenant_id,
      company_id,
      role_id,
      update,
    };

    const updated = await this.service.updateRole(input);

    return c.json(
      {
        success: true,
        message: "Successfully updated role",
        updated,
      },
      200,
    );
  };

  deleteRole = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const role_id = c.req.param("roleId");

    if (!role_id) {
      throw new RequestDataError("Role ID is required", 400);
    }

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      role_id,
    };

    const deleted = await this.service.deleteRole(input);

    return c.json(
      {
        success: true,
        message: "Successfully deleted role",
        deleted,
      },
      200,
    );
  };

  deletePermissionsFromRole = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    const role_id = c.req.param("roleId");

    if (!role_id) {
      throw new RequestDataError("Role ID is required", 400);
    }

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const permission_id = c.req.param("permissionId");

    if (!permission_id) {
      throw new RequestDataError("Permission ID is required", 400);
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      role_id,
      permission_id,
    };

    const removed = await this.service.deletePermissionsFromRole(input);

    return c.json(
      {
        success: true,
        message: "Successfully removed permission from role",
        removed,
      },
      200,
    );
  };

  removeRoleFromMember = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;
    const member_user_id = c.req.param("userId");
    const role_id = c.req.param("roleId");

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    if (!member_user_id) {
      throw new RequestDataError("User ID is required", 400);
    }

    if (!role_id) {
      throw new RequestDataError("Role ID is required", 400);
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
      member_user_id,
      role_id,
    };

    const removed = await this.service.removeRoleFromMember(input);

    return c.json(
      {
        success: true,
        message: "Successfully removed role from member",
        removed,
      },
      200,
    );
  };

  settings = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const input = {
      user_id,
      tenant_id,
      company_id,
    };

    const settings = await this.service.settings(input);

    return c.json(
      {
        success: true,
        message: "Successfully retrieved settings",
        settings,
      },
      200,
    );
  };

  updateSettings = async (c: Context<AppContext>) => {
    const { user_id, tenant_id, company_id } = c.var.user;

    if (!company_id) {
      throw new NotFoundError("User does not belong to a company");
    }

    const updateSettings = updateSettingsSchema.parse(await c.req.json());

    const input = {
      user_id,
      tenant_id,
      company_id,
      updateSettings,
    };

    const updated = await this.service.updateSettings(input);

    return c.json(
      {
        success: true,
        message: "Successfully updated settings",
        updated,
      },
      200,
    );
  };

  // auditTrail = async (
  //     c: Context<AppContext>
  // ) => {
  //     const { user_id, tenant_id, company_id } = c.var.user

  //     const input = {
  //         user_id,
  //         tenant_id,
  //         company_id
  //     }

  //     const auditTrail = await this.service.auditTrail(input)

  //     return c.json({
  //         success: true,
  //         message: "Successfully retrieved audit trail",
  //         auditTrail
  //     }, 200)
  // }
}
