import { prisma } from "../../../config/database.js";

export async function upsertSystemPermission(permission: {
  code: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}) {
  return prisma.permission.upsert({
    where: {
      code: permission.code,
    },
    update: {
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description ?? null,
    },
    create: permission,
  });
}

export async function upsertSystemRole(role: {
  code: string;
  name: string;
  description?: string;
}) {
  const existingRole = await prisma.role.findFirst({
    where: {
      tenant_id: null,
      company_id: null,
      code: role.code,
    },
  });

  if (existingRole) {
    return prisma.role.update({
      where: { id: existingRole.id },
      data: {
        tenant_id: null,
        company_id: null,
        name: role.name,
        description: role.description ?? null,
        is_system: true,
      },
    });
  }

  return prisma.role.create({
    data: {
      tenant_id: null,
      company_id: null,
      code: role.code,
      name: role.name,
      description: role.description ?? null,
      is_system: true,
    },
  });
}

export async function upsertRolePermission(
  roleId: string,
  permissionId: string,
) {
  return prisma.rolePermission.upsert({
    where: {
      role_id_permission_id: {
        role_id: roleId,
        permission_id: permissionId,
      },
    },
    update: {},
    create: {
      role_id: roleId,
      permission_id: permissionId,
    },
  });
}
