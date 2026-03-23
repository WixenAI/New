const Broker = require("../models/Broker");
const Trade = require("../models/Trade");
const { calculateCharges, roundCurrency } = require("../services/tradeMetrics");

async function listTrades(req, res) {
  const { brokerId, status } = req.query;
  const query = brokerId ? { brokerId } : {};
  if (status) {
    query.status = status;
  }

  const trades = await Trade.find(query)
    .populate("clientId", "fullName clientCode")
    .sort({ tradedAt: -1, createdAt: -1 });

  res.json(trades);
}

async function createTrade(req, res) {
  const broker = await Broker.findById(req.body.brokerId);

  if (!broker) {
    return res.status(404).json({ message: "Broker not found." });
  }

  const payload = {
    ...req.body,
    symbol: String(req.body.symbol || req.body.stockName || "").trim().toUpperCase(),
    stockName: String(req.body.stockName || req.body.symbol || "").trim().toUpperCase(),
    quantity: Number(req.body.quantity),
    entryPrice: Number(req.body.entryPrice),
    exitPrice: req.body.exitPrice ? Number(req.body.exitPrice) : undefined,
    buyPrice: Number(req.body.buyPrice ?? req.body.entryPrice),
    sellPrice: req.body.exitPrice ? Number(req.body.sellPrice ?? req.body.exitPrice) : undefined,
    totalBuy: Number(req.body.quantity) * Number(req.body.entryPrice),
    totalSell: req.body.exitPrice ? Number(req.body.quantity) * Number(req.body.exitPrice) : 0,
    brokeragePercent: Number(req.body.brokeragePercent || 0),
  };

  const metrics = calculateCharges(payload);
  const trade = await Trade.create({
    ...payload,
    charges: metrics.charges,
    grossPnL: metrics.grossPnL,
    netPnL: metrics.netPnL,
  });

  const populatedTrade = await Trade.findById(trade._id).populate("clientId", "fullName clientCode");
  res.status(201).json(populatedTrade);
}

async function updateTrade(req, res) {
  const existingTrade = await Trade.findById(req.params.tradeId);
  if (!existingTrade) {
    return res.status(404).json({ message: "Trade not found." });
  }

  const payload = {
    ...existingTrade.toObject(),
    ...req.body,
  };

  payload.symbol = String(payload.symbol || payload.stockName || "").trim().toUpperCase();
  payload.stockName = String(payload.stockName || payload.symbol || "").trim().toUpperCase();

  if (payload.quantity !== undefined) {
    payload.quantity = Number(payload.quantity);
  }
  if (payload.entryPrice !== undefined) {
    payload.entryPrice = Number(payload.entryPrice);
  }
  if (payload.exitPrice !== undefined && payload.exitPrice !== null && payload.exitPrice !== "") {
    payload.exitPrice = Number(payload.exitPrice);
  }

  payload.buyPrice = Number(payload.buyPrice ?? payload.entryPrice);
  payload.sellPrice = payload.exitPrice !== undefined ? Number(payload.sellPrice ?? payload.exitPrice) : undefined;
  payload.totalBuy = Number(payload.quantity || 0) * Number(payload.entryPrice || 0);
  payload.totalSell = Number(payload.quantity || 0) * Number(payload.exitPrice || 0);
  payload.brokeragePercent = Number(payload.brokeragePercent || 0);

  const metrics = calculateCharges(payload);
  const trade = await Trade.findByIdAndUpdate(
    req.params.tradeId,
    {
      ...payload,
      charges: metrics.charges,
      grossPnL: metrics.grossPnL,
      netPnL: metrics.netPnL,
    },
    { new: true, runValidators: true }
  ).populate("clientId", "fullName clientCode");

  res.json(trade);
}

async function listHoldings(req, res) {
  const { brokerId } = req.query;
  const query = { status: "open" };
  if (brokerId) {
    query.brokerId = brokerId;
  }

  const trades = await Trade.find(query).populate("clientId", "fullName clientCode");
  const grouped = new Map();

  trades.forEach((trade) => {
    const key = `${trade.clientId?._id || "unknown"}:${trade.symbol}:${trade.side}`;
    const current = grouped.get(key) || {
      symbol: trade.symbol,
      side: trade.side,
      segment: trade.segment,
      quantity: 0,
      averageEntry: 0,
      exposure: 0,
      client: trade.clientId,
    };

    const newQuantity = current.quantity + trade.quantity;
    const newExposure = current.exposure + trade.entryPrice * trade.quantity;

    current.quantity = newQuantity;
    current.exposure = roundCurrency(newExposure);
    current.averageEntry = newQuantity ? roundCurrency(newExposure / newQuantity) : 0;
    grouped.set(key, current);
  });

  res.json(Array.from(grouped.values()));
}

module.exports = { listTrades, createTrade, updateTrade, listHoldings };
