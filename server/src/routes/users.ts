import { Hono } from "hono";
import { getPrisma } from "../../lib/prisma.js";

const router = new Hono<{ Bindings: CloudflareBindings }>();

router.get("/", async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        occupation: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });
    return c.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

export default router;
