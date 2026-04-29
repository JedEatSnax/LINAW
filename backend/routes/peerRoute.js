const express = require("express");
const authenticate = require("../middleware/authenticate");
const { apiLimiter } = require("../middleware/rateLimiter");
const { asyncHandler } = require("../middleware/asyncHandler");
const {
  provisionOrganization,
  runInContainer,
  startPeerNode,
} = require("../service/fabric/peerService");

const router = express.Router();

router.post(
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

router.post("/org/provision", (request, response) => {
  const provisioned = provisionOrganization(request.body ?? {});

  response.status(201).json({
    ok: true,
    message: "organization provisioned",
    organization: provisioned,
  });
});

router.post(
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

module.exports = { router };
