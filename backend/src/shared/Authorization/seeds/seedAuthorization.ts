import { systemRoles } from "./SystemRoles.js";
import { systemPermissionSeeds } from "./systemPermissions.js";
import { systemRolePermissions } from "./systemRolePermissions.js";

import {
  upsertSystemPermission,
  upsertSystemRole,
  upsertRolePermission,
} from "../repository/authorizationRepository.js";

export async function seedAuthorization() {
  const permissionMap = new Map<string, string>();

  // 1. Create permissions
  for (const permission of systemPermissionSeeds) {
    const result = await upsertSystemPermission(permission);

    permissionMap.set(result.code, result.id);
  }

  // 2. Create roles
  const roleMap = new Map<string, string>();

  for (const role of systemRoles) {
    const result = await upsertSystemRole(role);

    roleMap.set(result.code, result.id);
  }

  // 3. Create role → permission mappings
  for (const [roleCode, permissionCodes] of Object.entries(
    systemRolePermissions,
  )) {
    const roleId = roleMap.get(roleCode);

    if (!roleId) {
      throw new Error(`System role "${roleCode}" was not found.`);
    }

    for (const permissionCode of permissionCodes) {
      const permissionId = permissionMap.get(permissionCode);

      if (!permissionId) {
        throw new Error(`System permission "${permissionCode}" was not found.`);
      }

      await upsertRolePermission(roleId, permissionId);
    }
  }
}
