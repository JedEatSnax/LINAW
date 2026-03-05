const express = require("express");
const router = express.Router();
const networkController = require("../controller/networkController");

// admin access only?? maybe??
// also needs some sort of auth??

router.post("/createNetwork", networkController.createNetwork);
router.post("/createCA", networkController.createCA);
router.post("/createOrderer", networkController.createOrderer);
router.post("/createPeer", networkController.createPeer);
router.post("/createChannel", networkController.createChannel);

// router.put

module.exports = router;
