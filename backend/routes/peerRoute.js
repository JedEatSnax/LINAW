const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const { apiLimiter } = require("../middleware/rateLimiter");
const peerController = require("../controllers/peerController");
const authorization = require("../middleware/authorize");
const permission = require("../config/authorization/permission");

router.post(
  "/peer/start",
  apiLimiter,
  authenticate.decodeToken,
  authorization.can(permission.MANAGE_NODE),
  peerController.startPeer,
);

router.post(
  "/org/provision",
  apiLimiter,
  authenticate.decodeToken,
  authorization.can(permission.CREATE_ORGANIZATION),
  peerController.provisionOrg,
);

router.post(
  "/container/exec",
  apiLimiter,
  authenticate.decodeToken,
  authorization.can(permission.MANAGE_NODE),
  peerController.execContainer,
);

module.exports = { router };
