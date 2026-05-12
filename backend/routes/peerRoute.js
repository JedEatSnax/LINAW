const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const { apiLimiter } = require("../middleware/rateLimiter");
const peerController = require("../controllers/peerController");

router.post(
  "/peer/start",
  apiLimiter,
  authenticate.decodeToken,
  peerController.startPeer,
);

router.post(
  "/org/provision",
  apiLimiter,
  authenticate.decodeToken,
  peerController.provisionOrg,
);

router.post(
  "/container/exec",
  apiLimiter,
  authenticate.decodeToken,
  peerController.execContainer,
);

module.exports = { router };
