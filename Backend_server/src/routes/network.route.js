const express = require("express");
const router = express.Router();
const networkController = require("../controllers/network.controller");

// Authentication Middlware

router.get("/createNetwork", networkController.createNetwork);

module.exports = { router };
