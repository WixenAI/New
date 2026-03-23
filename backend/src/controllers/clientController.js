const Client = require("../models/Client");

function buildAdminClientPayload(input) {
  const idCode = String(input.idCode || input.clientCode || "").trim().toUpperCase();
  const clientCode = String(input.clientCode || input.idCode || "").trim().toUpperCase();

  return {
    brokerId: input.brokerId,
    fullName: String(input.fullName || "").trim(),
    clientCode,
    idCode,
    email: input.email ? String(input.email).trim().toLowerCase() : "",
    phone: input.phone ? String(input.phone).trim() : "",
    address: input.address ? String(input.address).trim() : "",
    notes: input.notes ? String(input.notes).trim() : "",
    segment: input.segment || "intraday",
    status: input.status || "active",
  };
}

async function listClients(req, res) {
  const { brokerId } = req.query;
  const query = brokerId ? { brokerId } : {};
  const clients = await Client.find(query).sort({ createdAt: -1 });
  res.json(clients);
}

async function createClient(req, res) {
  const client = await Client.create(buildAdminClientPayload(req.body));
  res.status(201).json(client);
}

async function updateClient(req, res) {
  const existing = await Client.findById(req.params.clientId);
  const client = await Client.findByIdAndUpdate(req.params.clientId, buildAdminClientPayload({ ...existing?.toObject(), ...req.body }), {
    new: true,
    runValidators: true,
  });

  if (!client) {
    return res.status(404).json({ message: "Client not found." });
  }

  res.json(client);
}

module.exports = { listClients, createClient, updateClient };
