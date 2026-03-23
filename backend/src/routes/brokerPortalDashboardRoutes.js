const express = require("express");
const { getBrokerOverview } = require("../controllers/brokerPortalDashboardController");

const router = express.Router();

router.get("/overview", getBrokerOverview);

module.exports = router;
