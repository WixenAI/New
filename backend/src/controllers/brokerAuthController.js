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
    return res.status(400).json({ message: "tokenId is required." });
  }

  const broker = await Broker.findOne({ tokenId });
  if (!broker || broker.status !== "active") {
    return res.status(401).json({ message: "Invalid broker token." });
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
  return res.json({ message: "Broker logged out." });
}

module.exports = { login, me, logout, serializeBroker };
