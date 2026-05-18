import express from "express";
import cors from "cors";
import { tenantRouter } from "./routes/tenantRoutes";
import { errorHandler } from "./middleware/errorHandler.ts";

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: process.env["ALLOWED_ORIGIN"] ?? ["http://localhost:5173"],
    }),
  );
  app.use(express.json());

  app.use("/api/tenants", tenantRouter);
  app.use(errorHandler);

  return app;
}
