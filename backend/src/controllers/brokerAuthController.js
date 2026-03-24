const jwt = require("jsonwebtoken");
const Broker = require("../models/Broker");
const { BROKER_JWT_SECRET } = require("../middleware/requireBrokerAuth");

function serializeBroker(broker) {
  return {
    id: broker._id,
    name: broker.name,
    tokenId: broker.tokenId,
    legalName: broker.legalName,
    status: broker.status,
    contact: broker.contact,
    branding: broker.branding,
    documents: broker.documents,
  };
}

function createBrokerToken(broker) {
  return jwt.sign(
    {
      sub: broker._id.toString(),
      tokenId: broker.tokenId,
    },
    BROKER_JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function login(req, res) {
  const tokenId = String(req.body.tokenId || "").trim().toUpperCase();

  if (!tokenId) {
    return res.status(400).json({ code: "ACCESS_ID_REQUIRED", message: "Access ID is required." });
  }

  const broker = await Broker.findOne({ tokenId });
  if (!broker || broker.status !== "active") {
    return res.status(401).json({ code: "INVALID_ACCESS_ID", message: "Invalid access ID." });
  }

  return res.json({
    token: createBrokerToken(broker),
    broker: serializeBroker(broker),
  });
}

async function me(req, res) {
  return res.json({ broker: serializeBroker(req.broker) });
}

function logout(req, res) {
  return res.json({ message: "Access ended." });
}

module.exports = { login, me, logout, serializeBroker };
