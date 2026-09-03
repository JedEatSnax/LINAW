import { env } from "cloudflare:workers";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

export function getPrisma() {
  const adapter = new PrismaNeonHttp(env.DATABASE_URL!, {
    fetchOptions: {
      cache: "no-store",
    },
  });
  return new PrismaClient({
    adapter,
    errorFormat: "minimal",
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
