import { Hono } from "hono";
import { getPrisma } from "../../lib/prisma.js";

const router = new Hono<{ Bindings: CloudflareBindings }>();

const prisma = getPrisma();

router.get("/", async (c) => {
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
