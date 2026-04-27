import express from "express";

import { peerRouter } from "./peerRoutes.js";

export const apiRouter = express.Router();

apiRouter.get("/", (_request, response) => {
  response.json({ ok: true, service: "test-backend" });
});

apiRouter.use("/fabric", peerRouter);
