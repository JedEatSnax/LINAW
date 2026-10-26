import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as GeneratedPrismaClient } from "../generated/prisma/client.js";
import type { AppEnv } from "./env.js";

type PrismaClientInstance = InstanceType<typeof GeneratedPrismaClient>;

export function createPrismaClient(databaseUrl: string): PrismaClientInstance {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  return new GeneratedPrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

const prismaContext = new AsyncLocalStorage<PrismaClientInstance>();

const prismaBinding = new Proxy({} as PrismaClientInstance, {
  get(_target, property) {
    const client = prismaContext.getStore();

    if (!client) {
      throw new Error("Prisma client is not available in this request");
    }

    return Reflect.get(client, property, client);
  },
});

export function initializePrisma(env: AppEnv): PrismaClientInstance {
  return createPrismaClient(env.DATABASE_URL);
}

export function runWithPrisma<T>(
  client: PrismaClientInstance,
  callback: () => T,
): T {
  return prismaContext.run(client, callback);
}

export async function disposePrisma(
  client: PrismaClientInstance,
): Promise<void> {
  await client.$disconnect();
}

export { prismaBinding as prisma };
