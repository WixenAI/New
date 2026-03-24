require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { connectDatabase } = require("./config/database");
const { seedAdminUser } = require("./services/seedService");
const authRoutes = require("./routes/authRoutes");
const brokerAuthRoutes = require("./routes/brokerAuthRoutes");
const brokerRoutes = require("./routes/brokerRoutes");
const brokerPortalClientRoutes = require("./routes/brokerPortalClientRoutes");
const brokerPortalTradeRoutes = require("./routes/brokerPortalTradeRoutes");
const brokerPortalDashboardRoutes = require("./routes/brokerPortalDashboardRoutes");
const brokerPortalInvoiceRoutes = require("./routes/brokerPortalInvoiceRoutes");
const clientRoutes = require("./routes/clientRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { requireAuth } = require("./middleware/requireAuth");
const { requireBrokerAuth } = require("./middleware/requireBrokerAuth");

const app = express();
const PORT = process.env.PORT || 8000;
const uploadsDir = path.join(__dirname, "..", "uploads");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "broker-platform-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/broker-auth", brokerAuthRoutes);
app.use("/api/access", brokerAuthRoutes);
app.use("/api/brokers", requireAuth, brokerRoutes);
app.use("/api/clients", requireAuth, clientRoutes);
app.use("/api/trades", requireAuth, tradeRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/broker-portal/dashboard", requireBrokerAuth, brokerPortalDashboardRoutes);
app.use("/api/broker-portal/clients", requireBrokerAuth, brokerPortalClientRoutes);
app.use("/api/broker-portal/trades", requireBrokerAuth, brokerPortalTradeRoutes);
app.use("/api/broker-portal/invoices", requireBrokerAuth, brokerPortalInvoiceRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Uploaded image is too large. Maximum size is 5MB." });
  }

  if (err.message === "Only image uploads are allowed." || err.message === "Invalid upload target.") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === "Cloudinary is not configured.") {
    return res.status(500).json({ message: err.message });
  }

  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({ message: `${duplicateField} already exists.` });
  }

  if (err.name === "ValidationError") {
    const firstMessage = Object.values(err.errors || {})[0]?.message || "Validation failed.";
    return res.status(400).json({ message: firstMessage });
  }

  return res.status(500).json({
    message: err.message || "Unexpected server error.",
  });
});

async function startServer() {
  await connectDatabase();
  await seedAdminUser();

  app.listen(PORT, () => {
    console.log(`Broker platform API running on ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
