import { Router } from "express";
import {
  initFabricCaServer,
  startFabricCaServer,
} from "../controllers/caServerController.ts";

export const caServerRouter = Router();

caServerRouter.post("/init", initFabricCaServer);
caServerRouter.post("/start", startFabricCaServer);
