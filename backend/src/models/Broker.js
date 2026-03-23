const mongoose = require("mongoose");

const brokerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tokenId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    legalName: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    contact: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      website: { type: String, trim: true },
      supportDesk: { type: String, trim: true },
    },
    branding: {
      brokerageHouseName: { type: String, trim: true },
      logoText: { type: String, trim: true },
      shortName: { type: String, trim: true },
      primaryColor: { type: String, default: "#18b5d6" },
      accentColor: { type: String, default: "#87dff0" },
      surfaceTint: { type: String, default: "#f2fcff" },
      headerTone: { type: String, default: "Market-ready execution for modern broker desks." },
      logoUrl: { type: String, trim: true },
      logoPublicId: { type: String, trim: true },
      signatureUrl: { type: String, trim: true },
      signaturePublicId: { type: String, trim: true },
      trademarkUrl: { type: String, trim: true },
      trademarkPublicId: { type: String, trim: true },
      signatureLabel: { type: String, trim: true, default: "Authorized Signature" },
      trademarkLabel: { type: String, trim: true, default: "Registered Mark" },
    },
    documents: {
      templateKey: { type: String, default: "official-default" },
      statementPrefix: { type: String, default: "ST" },
      statementTitle: { type: String, default: "Closed Trade Statement" },
      statementSubtitle: { type: String, default: "Portfolio P&L Report" },
      clientLabel: { type: String, default: "Client ID" },
      receiptPrefix: { type: String, default: "RCP" },
      invoicePrefix: { type: String, default: "PVT" },
      footerText: {
        type: String,
        default: "This is a system-generated statement and does not require a signature.",
      },
      supportText: {
        type: String,
        default: "For support, contact your broker operations desk. All figures are in INR.",
      },
      disclaimer: {
        type: String,
        default: "Brokerage, statutory charges and trade values are subject to exchange rules and broker policy.",
      },
      showSignature: { type: Boolean, default: true },
      showTrademark: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Broker", brokerSchema);
