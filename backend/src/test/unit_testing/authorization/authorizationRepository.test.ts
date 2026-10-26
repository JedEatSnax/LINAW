import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    role: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("../../../config/database.js", () => ({
  prisma: prismaMock,
}));

import { upsertSystemRole } from "../../../shared/Authorization/repository/authorizationRepository.js";

describe("upsertSystemRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a global system role when it does not exist", async () => {
    prismaMock.role.findFirst.mockResolvedValue(null);
    prismaMock.role.create.mockResolvedValue({
      id: "role-id",
      code: "ORGANIZATION_ADMIN",
    });

    await upsertSystemRole({
      code: "ORGANIZATION_ADMIN",
      name: "Organization Admin",
      description: "Manages organization users, roles, and system access.",
    });

    expect(prismaMock.role.findFirst).toHaveBeenCalledWith({
      where: {
        tenant_id: null,
        company_id: null,
        code: "ORGANIZATION_ADMIN",
      },
    });
    expect(prismaMock.role.create).toHaveBeenCalledWith({
      data: {
        tenant_id: null,
        company_id: null,
        code: "ORGANIZATION_ADMIN",
        name: "Organization Admin",
        description: "Manages organization users, roles, and system access.",
        is_system: true,
      },
    });
  });

  it("repairs an existing global role without creating a duplicate", async () => {
    prismaMock.role.findFirst.mockResolvedValue({ id: "role-id" });
    prismaMock.role.update.mockResolvedValue({
      id: "role-id",
      code: "ORGANIZATION_ADMIN",
    });

    await upsertSystemRole({
      code: "ORGANIZATION_ADMIN",
      name: "Organization Admin",
    });

    expect(prismaMock.role.update).toHaveBeenCalledWith({
      where: { id: "role-id" },
      data: {
        tenant_id: null,
        company_id: null,
        name: "Organization Admin",
        description: null,
        is_system: true,
      },
    });
    expect(prismaMock.role.create).not.toHaveBeenCalled();
  });
});
