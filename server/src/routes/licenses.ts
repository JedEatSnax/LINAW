import { Hono } from "hono";
import { z } from "zod";
import { getPrisma } from "../../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { zValidator } from "@hono/zod-validator";

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

const LicenseCreateBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  product_key: z.string().min(1, "Product key is required"),
  expiration_date: z.coerce.date().optional(),
  licensedToEmail: z.email("Valid email is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  minimum_quantity: z.number().int().positive().optional(),
});

const router = new Hono<{ Bindings: CloudflareBindings }>();

router.get("/", async (c) => {
  const prisma = getPrisma();
  const licenses = await prisma.license.findMany({ select: licenseSelect });
  return c.json(licenses);
});

router.post("/", zValidator("json", LicenseCreateBodySchema), async (c) => {
  const data = c.req.valid("json");
  const prisma = getPrisma();
  const license = await prisma.license.create({
    data,
    select: licenseSelect,
  });
  return c.json(license, 201);
});

export default router;
