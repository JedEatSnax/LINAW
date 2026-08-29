import { Hono } from "hono";
import { getPrisma } from "../../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { zValidator } from "@hono/zod-validator";
import { LicenseCreateInputObjectSchema } from "../../prisma/generated/schemas/index.js";

const licenseSelect = {
  id: true,
  name: true,
  product_key: true,
  expiration_date: true,
  licensedTo: true,
  licensedToEmail: true,
  manufacturer: true,
  minimum_quantity: true,
} satisfies Prisma.LicenseSelect;

const router = new Hono<{ Bindings: CloudflareBindings }>();

const prisma = getPrisma();

router.get("/", async (c) => {
  try {
    const licenses = await prisma.license.findMany({ select: licenseSelect });
    return c.json(licenses);
  } catch (error) {
    console.error("Failed to fetch licenses:", error);
    return c.json({ error: "Failed to fetch licenses" }, 500);
  }
});

router.post(
  "/",
  zValidator("json", LicenseCreateInputObjectSchema),
  async (c) => {
    const body = c.req.valid("json");
    try {
      const license = await prisma.license.create({
        data: body,
      });
      return c.json(license, 201);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003")
          return c.json({ error: "Invalid foreign key" }, 400);
        if (error.code === "P2002")
          return c.json({ error: "Duplicate key" }, 400);
      }
      return c.json({ error: "Failed to create license" }, 500);
    }
  },
);

export default router;
