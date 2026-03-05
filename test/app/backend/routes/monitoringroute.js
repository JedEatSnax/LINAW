const express = require("express");
const router = express.Router();
const controllerMonitor = require("../controller/controllerMonitor");

// client stuff?? maybe??
// for now simple stuff gonna add more
router.post("/connect", controllerMonitor.connect);
router.post("/submitTransaction", controllerMonitor.submitTransaction);
router.post("/evaluateTransaction", controllerMonitor.evaluateTransaction);
router.get("/status", controllerMonitor.getStatus);

module.exports = router;
