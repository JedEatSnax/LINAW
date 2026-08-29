import { env } from "cloudflare:workers";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

export function getPrisma() {
  const adapter = new PrismaNeon({
    connectionString: env.DATABASE_URL!,
  });
  return new PrismaClient({
    adapter,
    errorFormat: "pretty",
    log: [
      {
        emit: "stdout",
        level: "query",
      },
      {
        emit: "stdout",
        level: "error",
      },
      {
        emit: "stdout",
        level: "info",
      },
      {
        emit: "stdout",
        level: "warn",
      },
    ],
  });
}
