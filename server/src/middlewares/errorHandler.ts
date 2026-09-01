import { type ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
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
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const knownError = prismaErrorMap[err.code];

    if (knownError) {
      let message = knownError.message;
      if (
        err.code === "P2002" &&
        err.meta &&
        Array.isArray(err.meta["target"])
      ) {
        message = `Duplicate entry for field(s): ${(err.meta["target"] as string[]).join(", ")}`;
      }
      return c.json({ error: message, code: err.code }, knownError.status);
    }

    console.error(`Unhandled Prisma Error [${err.code}]:`, err.message);
    return c.json({ error: "Database operation failed", code: err.code }, 500);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma Validation Error:", err.message);
    return c.json({ error: "Invalid database query payload." }, 400);
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error("Prisma Initialization Error:", err.message);
    return c.json({ error: "Database connection failed." }, 500);
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    console.error("Prisma Unknown Request Error:", err.message);
    return c.json({ error: "An unknown database error occurred." }, 500);
  }

  if (err instanceof Prisma.PrismaClientRustPanicError) {
    console.error("Prisma Engine Crash (Rust Panic):", err.message);
    return c.json({ error: "Critical database engine failure." }, 500);
  }

  console.error("Internal Server Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
};
