import { Hono } from "hono";
import { getPrisma } from "../../lib/prisma.js";

const router = new Hono<{ Bindings: CloudflareBindings }>();

router.get("/", async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  try {
    const licenses = await prisma.license.findMany({
      select: {
        id: true,
        name: true,
        product_key: true,
        expiration_date: true,
        licensedTo: true,
        licensedToEmail: true,
        manufacturer: true,
        minimum_quantity: true,
      },
    });
    return c.json(licenses);
  } catch (error) {
    console.error("Failed to fetch licenses:", error);
    return c.json({ error: "Failed to fetch licenses" }, 500);
  }
});

export default router;
