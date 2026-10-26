import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  PrismaPg: vi.fn(),
  GeneratedPrismaClient: vi.fn(),
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: mocks.PrismaPg,
}));

vi.mock("../../../generated/prisma/client.js", () => ({
  PrismaClient: mocks.GeneratedPrismaClient,
}));

import {
  disposePrisma,
  initializePrisma,
  prisma,
  runWithPrisma,
} from "../../../config/database.js";

const environment = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
} as Parameters<typeof initializePrisma>[0];

describe("Prisma client lifecycle", () => {
  let disconnect: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();
    disconnect = vi.fn().mockResolvedValue(undefined);
    mocks.GeneratedPrismaClient.mockImplementation(function (this: {
      $disconnect: typeof disconnect;
    }) {
      this.$disconnect = disconnect;
    });
    await disposePrisma(initializePrisma(environment));
    vi.resetAllMocks();
    mocks.GeneratedPrismaClient.mockImplementation(function (this: {
      $disconnect: typeof disconnect;
    }) {
      this.$disconnect = disconnect;
    });
  });

  it("isolates concurrent request contexts", async () => {
    const first = initializePrisma(environment);
    const second = initializePrisma(environment);

    expect(second).not.toBe(first);
    expect(mocks.PrismaPg).toHaveBeenCalledTimes(2);
    expect(mocks.GeneratedPrismaClient).toHaveBeenCalledTimes(2);
    expect(disconnect).not.toHaveBeenCalled();

    const clients = await Promise.all([
      runWithPrisma(first, () => prisma.$disconnect),
      runWithPrisma(second, () => prisma.$disconnect),
    ]);

    expect(clients).toEqual([first.$disconnect, second.$disconnect]);

    await disposePrisma(first);
    await disposePrisma(second);
    expect(disconnect).toHaveBeenCalledTimes(2);
  });

  it("disconnects only when explicitly disposed", async () => {
    const client = initializePrisma(environment);

    await disposePrisma(client);

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(initializePrisma(environment)).not.toBe(client);
  });
});
