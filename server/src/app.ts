import express from "express";
import cors from "cors";
import { caServerRouter } from "./routes/caServerRoutes";
import { errorHandler } from "./middleware/errorHandler.ts";

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: process.env["ALLOWED_ORIGIN"] ?? ["http://localhost:5173"],
    }),
  );
  app.use(express.json());

  app.use("/api/fabric-ca-server", caServerRouter);
  app.use(errorHandler);

  return app;
}
