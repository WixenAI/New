const express = require("express");
const { login, me, logout } = require("../controllers/brokerAuthController");
const { requireBrokerAuth } = require("../middleware/requireBrokerAuth");

const router = express.Router();

router.post("/login", login);
router.get("/me", requireBrokerAuth, me);
router.post("/logout", requireBrokerAuth, logout);

module.exports = router;
