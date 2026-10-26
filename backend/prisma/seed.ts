import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
    disposePrisma,
    runWithPrisma,
} from "../src/config/database.js";
import { seedAuthorization } from "../src/shared/Authorization/seeds/seedAuthorization.js";

const databaseUrl =
    process.env.PRISMA_DATABASE === "test"
        ? process.env.TEST_DATABASE_URL
        : process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        "A database URL is required. Set DATABASE_URL, or set PRISMA_DATABASE=test with TEST_DATABASE_URL.",
    );
}

const generatedClientPath = "../src/generated/prisma-node/client.js";
const { PrismaClient: SeedPrismaClient } = await import(generatedClientPath);

const client = new SeedPrismaClient({
    adapter: new PrismaPg({
        connectionString: databaseUrl,
    }),
});

try {
    await runWithPrisma(
        client as unknown as Parameters<typeof runWithPrisma>[0],
        () => seedAuthorization(),
    );
} finally {
    await disposePrisma(
        client as unknown as Parameters<typeof disposePrisma>[0],
    );
}