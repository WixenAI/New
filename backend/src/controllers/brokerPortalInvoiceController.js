const Client = require("../models/Client");
const Trade = require("../models/Trade");
const { roundCurrency } = require("../services/tradeMetrics");

function buildSummary(trades) {
  return trades.reduce(
    (acc, trade) => {
      acc.totalTrades += 1;
      acc.totalBuy += trade.totalBuy || 0;
      acc.totalSell += trade.totalSell || 0;
      acc.totalBrokerage += trade.charges?.total || 0;
      acc.grossPnL += trade.grossPnL || 0;
      acc.netPnL += trade.netPnL || 0;
      return acc;
    },
    { totalTrades: 0, totalBuy: 0, totalSell: 0, totalBrokerage: 0, grossPnL: 0, netPnL: 0 }
  );
}

async function getInvoicePreview(req, res) {
  const { clientId, fromDate, toDate } = req.query;

  if (!clientId || !fromDate || !toDate) {
    return res.status(400).json({ message: "clientId, fromDate, and toDate are required." });
  }

  const client = await Client.findOne({ _id: clientId, brokerId: req.broker._id });
  if (!client) {
    return res.status(404).json({ message: "Client not found." });
  }

  const endDate = new Date(toDate);
  endDate.setHours(23, 59, 59, 999);

  const trades = await Trade.find({
    brokerId: req.broker._id,
    clientId,
    status: "closed",
    tradedAt: {
      $gte: new Date(fromDate),
      $lte: endDate,
    },
  })
    .populate("clientId", "fullName clientCode idCode phone address")
    .sort({ tradedAt: 1, createdAt: 1 });

  const summary = buildSummary(trades);

  return res.json({
    broker: {
      id: req.broker._id,
      name: req.broker.name,
      tokenId: req.broker.tokenId,
      branding: req.broker.branding,
      documents: req.broker.documents,
      contact: req.broker.contact,
    },
    client,
    filters: { fromDate, toDate },
    trades,
    summary: {
      totalTrades: summary.totalTrades,
      totalBuy: roundCurrency(summary.totalBuy),
      totalSell: roundCurrency(summary.totalSell),
      totalBrokerage: roundCurrency(summary.totalBrokerage),
      grossPnL: roundCurrency(summary.grossPnL),
      netPnL: roundCurrency(summary.netPnL),
    },
  });
}

module.exports = { getInvoicePreview };
