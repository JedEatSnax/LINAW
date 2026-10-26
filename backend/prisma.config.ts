import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config();

const databaseUrl =
  process.env.PRISMA_DATABASE === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Database URL is required");
}

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url: databaseUrl,
  },
});