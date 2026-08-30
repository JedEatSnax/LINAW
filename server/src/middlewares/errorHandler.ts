import { type ErrorHandler } from "hono";
import { Prisma } from "../generated/prisma/client.js";

type ErrorStatusCode = 400 | 404 | 409 | 500;

const prismaErrorMap: Record<
  string,
  { status: ErrorStatusCode; message: string }
> = {
  P2002: { status: 409, message: "Duplicate value found." },
  P2003: { status: 400, message: "Invalid reference data." },
  P2025: { status: 404, message: "Record not found." },
  P2021: { status: 500, message: "Table does not exist." },
  P2022: { status: 500, message: "Column does not exist." },
};

export const globalErrorHandler: ErrorHandler = (err, c) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const knownError = prismaErrorMap[err.code];

    if (knownError) {
      return c.json({ error: knownError.message }, knownError.status);
    }

    console.error(`Unhandled Prisma Error [${err.code}]:`, err.message);
    return c.json({ error: "Database operation failed" }, 500);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return c.json({ error: "Invalid input data." }, 400);
  }

  console.error("Internal Server Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
};
