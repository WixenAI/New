const jwt = require("jsonwebtoken");
const Broker = require("../models/Broker");

const BROKER_JWT_SECRET = process.env.BROKER_JWT_SECRET || "broker-platform-broker-secret";

async function requireBrokerAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Broker authentication required." });
  }

  try {
    const payload = jwt.verify(token, BROKER_JWT_SECRET);
    const broker = await Broker.findById(payload.sub);

    if (!broker || broker.status !== "active") {
      return res.status(401).json({ message: "Broker session is inactive." });
    }

    req.broker = broker;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired broker session." });
  }
}

module.exports = { requireBrokerAuth, BROKER_JWT_SECRET };
