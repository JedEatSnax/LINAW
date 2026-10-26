import type { AppContext } from "../../shared/types/hono.js";
import { Context } from "hono";
import { UserManagementService } from "./userManagementService.js";
import {
  UpdateUserProfileSchema,
  OrganizationRegistrationSchema,
} from "./userManagementValidator.js";

export class userManagementController {
  constructor(private service: UserManagementService) {}

  profile = async (c: Context<AppContext>) => {
    const { user_id: userId, tenant_id: tenantId } = c.get("user");

    const user = await this.service.profile(userId, tenantId);

    return c.json(
      {
        success: true,
        message: "Profile retrieved successfully",
        data: user,
      },
      200,
    );
  };

  updateProfile = async (c: Context<AppContext>) => {
    const { user_id: userId, tenant_id: tenantId } = c.get("user");

    const userProfileUpdate = UpdateUserProfileSchema.parse(await c.req.json());

    const profile = await this.service.updateProfile(
      userId,
      tenantId,
      userProfileUpdate,
    );

    return c.json(
      {
        success: true,
        message: "Profile has been updated successfully",
        data: profile,
      },
      200,
    );
  };

  companyRegistration = async (c: Context<AppContext>) => {
    const { user_id: userId, tenant_id: tenantId } = c.get("user");

    const companyRegister = OrganizationRegistrationSchema.parse(
      await c.req.json(),
    );

    const company = await this.service.companyRegister(
      userId,
      tenantId,
      companyRegister,
    );

    return c.json(
      {
        success: true,
        message: "Company has been successfully registered",
        data: company,
      },
      201,
    );
  };
}
