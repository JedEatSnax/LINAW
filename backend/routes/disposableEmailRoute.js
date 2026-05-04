const express = require("express");
const router = express.Router();
const disposableController = require("../controllers/disposableEmailController");

// GET /:email -> check disposable status for email
router.get("/:email", disposableController.check);

module.exports = { router };
