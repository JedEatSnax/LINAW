import type { Context, Next } from "hono";

import type { Permission } from "./seeds/systemPermissions.js";
import type { AppContext } from "../types/hono.js";
import { getUserRole } from "../../modules/authentication/authRepository.js";

export function hasPermission(
  role: Awaited<ReturnType<typeof getUserRole>>,
  permission: Permission,
): boolean {
  if (!role) {
    return false;
  }

  if (role.code === "ORGANIZATION_ADMIN") {
    return true;
  }

  return role.role_permissions.some(
    (rolePermission) => rolePermission.permission.code === permission,
  );
}

export function Authorize(permission: Permission) {
  return async (
    c: Context<AppContext>,
    next: Next,
  ): Promise<Response | void> => {
    const user = c.get("user");

    const role = await getUserRole(user.user_id, user.tenant_id);

    if (!role) {
      return c.json(
        {
          message: "Forbidden",
        },
        403,
      );
    }

    if (!hasPermission(role, permission)) {
      return c.json(
        {
          message: "Forbidden",
        },
        403,
      );
    }

    await next();
  };
}
