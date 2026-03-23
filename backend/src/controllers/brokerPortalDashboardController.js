const Client = require("../models/Client");
const Trade = require("../models/Trade");
const { roundCurrency } = require("../services/tradeMetrics");

async function getBrokerOverview(req, res) {
  const brokerId = req.broker._id;

  const [clientCount, trades, recentTrades] = await Promise.all([
    Client.countDocuments({ brokerId }),
    Trade.find({ brokerId }).populate("clientId", "fullName clientCode idCode").sort({ tradedAt: -1 }),
    Trade.find({ brokerId }).populate("clientId", "fullName clientCode idCode").sort({ tradedAt: -1 }).limit(5),
  ]);

  const totals = trades.reduce(
    (acc, trade) => {
      acc.turnover += (trade.totalBuy || trade.quantity * trade.entryPrice || 0) + (trade.totalSell || trade.quantity * (trade.exitPrice || 0) || 0);
      acc.netPnL += trade.netPnL || 0;
      acc.openTrades += trade.status === "open" ? 1 : 0;
      return acc;
    },
    { turnover: 0, netPnL: 0, openTrades: 0 }
  );

  return res.json({
    brokerId,
    clientCount,
    tradeCount: trades.length,
    openTrades: totals.openTrades,
    turnover: roundCurrency(totals.turnover),
    netPnL: roundCurrency(totals.netPnL),
    recentTrades,
  });
}

module.exports = { getBrokerOverview };
