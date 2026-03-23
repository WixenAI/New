const express = require("express");
const { listClients, createClient, updateClient } = require("../controllers/clientController");

const router = express.Router();

router.get("/", listClients);
router.post("/", createClient);
router.patch("/:clientId", updateClient);

module.exports = router;
