export type SystemRoles =
  | "Organization Admin"
  | "Employee"
  | "Procurement Officer"
  | "Auditor";

export const systemRoles = [
  {
    code: "ORGANIZATION_ADMIN",
    name: "Organization Admin",
    description: "Manages organization users, roles, and system access.",
  },
  {
    code: "EMPLOYEE",
    name: "Employee",
    description: "Creates and manages purchase requisitions.",
  },
  {
    code: "PROCUREMENT_OFFICER",
    name: "Procurement Officer",
    description: "Manages and processes purchase requisitions.",
  },
  {
    code: "AUDITOR",
    name: "Auditor",
    description: "Reviews and verifies audit records.",
  },
] as const;

export type SystemRoleCode = (typeof systemRoles)[number]["code"];
