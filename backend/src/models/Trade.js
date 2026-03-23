const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    brokerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Broker",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    symbol: { type: String, required: true, trim: true, uppercase: true },
    stockName: { type: String, trim: true },
    tradeMode: {
      type: String,
      enum: ["mis", "nrml", "cnc"],
      default: "mis",
    },
    segment: {
      type: String,
      enum: ["intraday", "delivery", "futures", "options", "commodity"],
      default: "intraday",
    },
    side: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    entryPrice: { type: Number, required: true, min: 0 },
    exitPrice: { type: Number, min: 0 },
    buyPrice: { type: Number, min: 0 },
    sellPrice: { type: Number, min: 0 },
    totalBuy: { type: Number, default: 0 },
    totalSell: { type: Number, default: 0 },
    brokeragePercent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    tradedAt: { type: Date, default: Date.now },
    charges: {
      brokerage: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      exchangeFee: { type: Number, default: 0 },
      sebiFee: { type: Number, default: 0 },
      stampDuty: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    grossPnL: { type: Number, default: 0 },
    netPnL: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trade", tradeSchema);
