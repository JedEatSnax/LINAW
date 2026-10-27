export type MembershipStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type CompanySettings = {
  id: string;
  legal_name: string;
  display_name: string;
  tax_id: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

export type OrganizationMember = {
  id: string;
  user_id: string;
  job_title: string | null;
  employment_status: MembershipStatus | null;
  user?: { first_name?: string; last_name?: string; email?: string } | null;
  role?: { id: string; name: string } | null;
};

export type OrganizationRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
};

export type Permission = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type ApiBody = { success?: boolean; message?: string; [key: string]: unknown };

import { authFetch, refreshWithAuthTransition } from "@/lib/auth-client";

export class OrganizationApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "OrganizationApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await authFetch(`/api/organization-administration/${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new OrganizationApiError(
      0,
      "Unable to reach the organization service.",
    );
  }

  const body = (await response.json().catch(() => null)) as ApiBody | null;
  if (!response.ok || body?.success !== true) {
    throw new OrganizationApiError(
      response.status,
      typeof body?.message === "string"
        ? body.message
        : "The organization request could not be completed.",
    );
  }
  return body as T;
}

export async function refreshAuthenticationSession() {
  try {
    await refreshWithAuthTransition();
  } catch {
    throw new OrganizationApiError(0, "Unable to refresh your session.");
  }
}

export async function getSettings() {
  const body = await request<{ settings: CompanySettings }>("settings");
  return body.settings;
}

export async function updateSettings(input: Record<string, string>) {
  const body = await request<{ updated: CompanySettings }>("settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return body.updated;
}

export async function getMembers() {
  const body = await request<{ memberList: OrganizationMember[] }>("members");
  return body.memberList;
}

export async function inviteMember(email: string) {
  return request("members", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function validateMemberInvitation(token: string) {
  const response = await authFetch(
    `/api/organization-administration/members/validate/${encodeURIComponent(token)}`,
    { cache: "no-store" },
    { retryOnUnauthorized: false },
  );
  const body = (await response.json().catch(() => ({}))) as ApiBody & {
    data?: { expires_at?: string };
  };
  if (!response.ok || body.success !== true) {
    throw new OrganizationApiError(
      response.status,
      body.message ?? "This invitation is no longer valid.",
    );
  }
  return body.data;
}

export async function acceptMemberInvitation(token: string) {
  return request("members/accept", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function updateMember(
  userId: string,
  input: Record<string, unknown>,
) {
  return request(`members/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function assignRoleToMember(userId: string, roleId: string) {
  return updateMember(userId, { role_id: roleId });
}

export async function updateMemberStatus(
  userId: string,
  status: MembershipStatus,
) {
  return updateMember(userId, { employment_status: status });
}

export async function removeMember(userId: string) {
  return request(`members/${encodeURIComponent(userId)}`, { method: "DELETE" });
}

export async function getRoles() {
  const body = await request<{ roles: OrganizationRole[] }>("roles");
  return body.roles;
}

export async function createRole(input: { name: string; description: string }) {
  return request("roles", { method: "POST", body: JSON.stringify(input) });
}

export async function updateRole(
  roleId: string,
  input: Record<string, unknown>,
) {
  return request(`roles/${encodeURIComponent(roleId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteRole(roleId: string) {
  return request(`roles/${encodeURIComponent(roleId)}`, { method: "DELETE" });
}

export async function getPermissions() {
  const body = await request<{ permissions: Permission[] }>("permissions");
  return body.permissions;
}

export async function getRolePermissions(roleId: string) {
  const body = await request<{
    permissions: Array<{ permission: Permission }>;
  }>(`roles/${encodeURIComponent(roleId)}/permissions`);
  return body.permissions;
}

export async function addRolePermissions(
  roleId: string,
  permissionIds: string[],
) {
  return request(`roles/${encodeURIComponent(roleId)}/permissions`, {
    method: "POST",
    body: JSON.stringify({ permissionIds }),
  });
}

export async function removeRolePermission(
  roleId: string,
  permissionId: string,
) {
  return request(
    `roles/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(permissionId)}`,
    { method: "DELETE" },
  );
}

export async function registerCompany(input: Record<string, string>) {
  const body = await request<{
    data: { companyId: string; companyName: string };
  }>("registration", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return body.data;
}
