const express = require("express");
const {
  listBrokerTrades,
  createBrokerTrade,
  updateBrokerTrade,
  deleteBrokerTrade,
  deleteSelectedBrokerTrades,
  clearAllBrokerTrades,
  listBrokerHoldings,
} = require("../controllers/brokerPortalTradeController");

const router = express.Router();

router.get("/", listBrokerTrades);
router.post("/", createBrokerTrade);
router.get("/holdings", listBrokerHoldings);
router.post("/delete-selected", deleteSelectedBrokerTrades);
router.delete("/clear-all", clearAllBrokerTrades);
router.patch("/:tradeId", updateBrokerTrade);
router.delete("/:tradeId", deleteBrokerTrade);

module.exports = router;
