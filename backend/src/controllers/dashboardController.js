const Client = require("../models/Client");
const Trade = require("../models/Trade");
const { roundCurrency } = require("../services/tradeMetrics");

async function getOverview(req, res) {
  const { brokerId } = req.query;
  if (!brokerId) {
    return res.status(400).json({ message: "brokerId is required." });
  }

  const [clientCount, trades, recentTrades] = await Promise.all([
    Client.countDocuments({ brokerId }),
    Trade.find({ brokerId }).populate("clientId", "fullName clientCode").sort({ tradedAt: -1 }),
    Trade.find({ brokerId }).populate("clientId", "fullName clientCode").sort({ tradedAt: -1 }).limit(5),
  ]);

  const totals = trades.reduce(
    (acc, trade) => {
      acc.turnover += (trade.entryPrice + (trade.exitPrice || 0)) * trade.quantity;
      acc.netPnL += trade.netPnL || 0;
      acc.openTrades += trade.status === "open" ? 1 : 0;
      return acc;
    },
    { turnover: 0, netPnL: 0, openTrades: 0 }
  );

  res.json({
    brokerId,
    clientCount,
    tradeCount: trades.length,
    openTrades: totals.openTrades,
    turnover: roundCurrency(totals.turnover),
    netPnL: roundCurrency(totals.netPnL),
    recentTrades,
  });
}

module.exports = { getOverview };
