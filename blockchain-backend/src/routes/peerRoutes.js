import express from "express";

import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  provisionOrganization,
  runInContainer,
  startPeerNode,
} from "../service/peerService.js";

export const peerRouter = express.Router();

peerRouter.post(
  "/peer/start",
  asyncHandler(async (request, response) => {
    const { organization } = request.body ?? {};
    const startedPeer = await startPeerNode(organization);

    response.status(202).json({
      ok: true,
      message: "peer node start launched",
      ...startedPeer,
    });
  }),
);

peerRouter.post("/org/provision", (request, response) => {
  const provisioned = provisionOrganization(request.body ?? {});

  response.status(201).json({
    ok: true,
    message: "organization provisioned",
    organization: provisioned,
  });
});

peerRouter.post(
  "/container/exec",
  asyncHandler(async (request, response) => {
    const { containerName, command } = request.body ?? {};
    const result = await runInContainer(containerName, command);

    response.status(200).json({
      ok: true,
      message: "container command executed",
      ...result,
    });
  }),
);
