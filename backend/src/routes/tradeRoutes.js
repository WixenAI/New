const express = require("express");
const { listTrades, createTrade, updateTrade, listHoldings } = require("../controllers/tradeController");

const router = express.Router();

router.get("/", listTrades);
router.post("/", createTrade);
router.patch("/:tradeId", updateTrade);
router.get("/holdings/list", listHoldings);

module.exports = router;
