import { Hono } from "hono";
import { getPrisma } from "../../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { zValidator } from "@hono/zod-validator";
import { UserUncheckedCreateInputObjectZodSchema } from "../../prisma/generated/schemas/index.js";

const userSelect = {
  id: true,
  email: true,
  name: true,
  occupation: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

const UserCreateBodySchema = UserUncheckedCreateInputObjectZodSchema.omit({
  id: true,
  created_at: true,
  license: true,
});

const router = new Hono<{ Bindings: CloudflareBindings }>();

router.get("/", async (c) => {
  const prisma = getPrisma();
  const users = await prisma.user.findMany({ select: userSelect });
  return c.json(users);
});

router.post("/", zValidator("json", UserCreateBodySchema), async (c) => {
  const data = c.req.valid("json");
  const prisma = getPrisma();
  const user = await prisma.user.create({
    data,
    select: userSelect,
  });
  return c.json(user, 201);
});

export default router;
