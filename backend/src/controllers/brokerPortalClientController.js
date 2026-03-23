const fs = require("fs/promises");
const path = require("path");
const Client = require("../models/Client");
const { uploadImageBuffer } = require("../config/cloudinary");
const { ALLOWED_CUSTOMER_DOCUMENT_TYPES, getCustomerUploadDir } = require("../config/upload");

const CUSTOMER_DOCUMENT_FIELD_MAP = {
  aadhaarFront: "aadhaarFrontUrl",
  aadhaarBack: "aadhaarBackUrl",
  panImage: "panImageUrl",
  customerPhoto: "customerPhotoUrl",
  customerSignature: "customerSignatureUrl",
};

const CUSTOMER_DOCUMENT_PUBLIC_ID_FIELD_MAP = {
  aadhaarFront: "aadhaarFrontPublicId",
  aadhaarBack: "aadhaarBackPublicId",
  panImage: "panImagePublicId",
  customerPhoto: "customerPhotoPublicId",
  customerSignature: "customerSignaturePublicId",
};

function getCustomerDocumentPublicId(clientId, documentType) {
  return `broker-platform/customers/${clientId}/${documentType}`;
}

async function deleteLegacyUpload(filePath) {
  if (!filePath || !String(filePath).startsWith("/uploads/")) {
    return;
  }

  const absolutePath = path.join(__dirname, "..", "..", filePath.replace(/^\//, ""));
  await fs.unlink(absolutePath).catch(() => {});
}

function buildReferenceNumber(broker, client) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `KYC-${broker.tokenId}-${client.idCode}-${stamp}`.toUpperCase();
}

function toDateValue(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function deriveFullName(input = {}, existing = {}) {
  const firstName = String(input.firstName || input.kyc?.firstName || existing.kyc?.firstName || "").trim();
  const lastName = String(input.lastName || input.kyc?.lastName || existing.kyc?.lastName || "").trim();
  const combined = `${firstName} ${lastName}`.trim();

  if (combined) {
    return combined;
  }

  return String(input.fullName ?? existing.fullName ?? "").trim();
}

function isKycComplete(client) {
  const kyc = client.kyc || {};

  return Boolean(
    String(kyc.firstName || "").trim() &&
      String(kyc.lastName || "").trim() &&
      String(kyc.fatherName || "").trim() &&
      String(client.idCode || "").trim() &&
      String(client.phone || "").trim() &&
      String(client.address || "").trim() &&
      String(kyc.gender || "").trim() &&
      kyc.dateOfBirth &&
      kyc.applicationDate &&
      Number(kyc.initialDeposit || 0) >= 0 &&
      String(kyc.aadhaarNumber || "").trim() &&
      String(kyc.panNumber || "").trim() &&
      String(kyc.aadhaarFrontUrl || "").trim() &&
      String(kyc.aadhaarBackUrl || "").trim() &&
      String(kyc.panImageUrl || "").trim() &&
      String(kyc.customerPhotoUrl || "").trim() &&
      String(kyc.customerSignatureUrl || "").trim()
  );
}

function getNextKycStatus(client, previousStatus = "incomplete") {
  if (!isKycComplete(client)) {
    return "incomplete";
  }

  return previousStatus === "generated" ? "generated" : "ready";
}

function buildKycPayload(input = {}, existingKyc = {}) {
  return {
    firstName: input.firstName ? String(input.firstName).trim() : existingKyc.firstName || "",
    lastName: input.lastName ? String(input.lastName).trim() : existingKyc.lastName || "",
    fatherName: input.fatherName ? String(input.fatherName).trim() : existingKyc.fatherName || "",
    dateOfBirth: toDateValue(input.dateOfBirth, existingKyc.dateOfBirth || null),
    gender: input.gender !== undefined ? String(input.gender || "").trim().toLowerCase() : existingKyc.gender || "",
    applicationDate: toDateValue(input.applicationDate, existingKyc.applicationDate || null),
    initialDeposit: input.initialDeposit !== undefined ? Number(input.initialDeposit || 0) : existingKyc.initialDeposit || 0,
    aadhaarNumber: input.aadhaarNumber ? String(input.aadhaarNumber).trim() : existingKyc.aadhaarNumber || "",
    aadhaarFrontUrl: input.aadhaarFrontUrl || existingKyc.aadhaarFrontUrl || "",
    aadhaarFrontPublicId: input.aadhaarFrontPublicId || existingKyc.aadhaarFrontPublicId || "",
    aadhaarBackUrl: input.aadhaarBackUrl || existingKyc.aadhaarBackUrl || "",
    aadhaarBackPublicId: input.aadhaarBackPublicId || existingKyc.aadhaarBackPublicId || "",
    panNumber: input.panNumber ? String(input.panNumber).trim().toUpperCase() : existingKyc.panNumber || "",
    panImageUrl: input.panImageUrl || existingKyc.panImageUrl || "",
    panImagePublicId: input.panImagePublicId || existingKyc.panImagePublicId || "",
    customerPhotoUrl: input.customerPhotoUrl || existingKyc.customerPhotoUrl || "",
    customerPhotoPublicId: input.customerPhotoPublicId || existingKyc.customerPhotoPublicId || "",
    customerSignatureUrl: input.customerSignatureUrl || existingKyc.customerSignatureUrl || "",
    customerSignaturePublicId: input.customerSignaturePublicId || existingKyc.customerSignaturePublicId || "",
    status: existingKyc.status || "incomplete",
    referenceNumber: existingKyc.referenceNumber || "",
    generatedAt: existingKyc.generatedAt || null,
  };
}

function buildClientPayload(input, existing = {}) {
  const idCode = String(input.idCode || input.clientCode || existing.idCode || "").trim().toUpperCase();
  const clientCode = String(input.clientCode || input.idCode || existing.clientCode || "").trim().toUpperCase();
  const existingKyc = existing.kyc?.toObject?.() || existing.kyc || {};

  const payload = {
    fullName: deriveFullName(input, existing),
    clientCode,
    idCode,
    email: input.email !== undefined ? String(input.email || "").trim().toLowerCase() : existing.email || "",
    phone: input.phone !== undefined ? String(input.phone || "").trim() : existing.phone || "",
    address: input.address !== undefined ? String(input.address || "").trim() : existing.address || "",
    notes: input.notes !== undefined ? String(input.notes || "").trim() : existing.notes || "",
    segment: input.segment || existing.segment || "intraday",
    status: input.status || existing.status || "active",
    kyc: buildKycPayload(input.kyc || input, existingKyc),
  };

  payload.kyc.status = getNextKycStatus(payload, existingKyc.status);

  if (payload.kyc.status !== "generated") {
    payload.kyc.generatedAt = existingKyc.generatedAt || null;
    payload.kyc.referenceNumber = existingKyc.referenceNumber || "";
  }

  return payload;
}

function serializeBroker(broker) {
  return {
    id: broker._id,
    name: broker.name,
    legalName: broker.legalName,
    tokenId: broker.tokenId,
    contact: broker.contact,
    branding: broker.branding,
    documents: broker.documents,
  };
}

async function findBrokerClient(brokerId, clientId) {
  return Client.findOne({ _id: clientId, brokerId });
}

async function listBrokerClients(req, res) {
  const search = String(req.query.search || "").trim();
  const query = { brokerId: req.broker._id };

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { clientCode: { $regex: search, $options: "i" } },
      { idCode: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const clients = await Client.find(query).sort({ fullName: 1, createdAt: -1 });
  return res.json(clients);
}

async function getBrokerClient(req, res) {
  const client = await findBrokerClient(req.broker._id, req.params.clientId);
  if (!client) {
    return res.status(404).json({ message: "Client not found." });
  }

  return res.json(client);
}

async function createBrokerClient(req, res) {
  const payload = buildClientPayload(req.body);
  const client = await Client.create({
    ...payload,
    brokerId: req.broker._id,
  });

  return res.status(201).json(client);
}

async function updateBrokerClient(req, res) {
  const existing = await findBrokerClient(req.broker._id, req.params.clientId);
  if (!existing) {
    return res.status(404).json({ message: "Client not found." });
  }

  const payload = buildClientPayload(req.body, existing);
  const client = await Client.findOneAndUpdate(
    { _id: req.params.clientId, brokerId: req.broker._id },
    payload,
    { new: true, runValidators: true }
  );

  return res.json(client);
}

async function uploadCustomerDocument(req, res) {
  const { clientId, documentType } = req.params;
  const client = await findBrokerClient(req.broker._id, clientId);

  if (!client) {
    return res.status(404).json({ message: "Client not found." });
  }

  if (!ALLOWED_CUSTOMER_DOCUMENT_TYPES.has(documentType)) {
    return res.status(400).json({ message: "Invalid document type." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const existingKyc = client.kyc?.toObject?.() || client.kyc || {};
  const fieldName = CUSTOMER_DOCUMENT_FIELD_MAP[documentType];
  const publicIdFieldName = CUSTOMER_DOCUMENT_PUBLIC_ID_FIELD_MAP[documentType];
  const previousFile = existingKyc[fieldName];
  const uploadedAsset = await uploadImageBuffer(req.file, {
    publicId: getCustomerDocumentPublicId(clientId, documentType),
  });

  client.kyc = {
    ...existingKyc,
    [fieldName]: uploadedAsset.secureUrl,
    [publicIdFieldName]: uploadedAsset.publicId,
  };
  client.kyc.status = getNextKycStatus(client.toObject(), existingKyc.status);

  await client.save();

  await deleteLegacyUpload(previousFile);

  return res.json(client);
}

async function getCustomerKycPreview(req, res) {
  const client = await findBrokerClient(req.broker._id, req.params.clientId);
  if (!client) {
    return res.status(404).json({ message: "Client not found." });
  }

  return res.json({
    broker: serializeBroker(req.broker),
    client,
  });
}

async function generateCustomerKyc(req, res) {
  const client = await findBrokerClient(req.broker._id, req.params.clientId);
  if (!client) {
    return res.status(404).json({ message: "Client not found." });
  }

  if (!isKycComplete(client)) {
    return res.status(400).json({ message: "Complete the KYC details and uploads first." });
  }

  const existingKyc = client.kyc?.toObject?.() || client.kyc || {};

  client.kyc = {
    ...existingKyc,
    status: "generated",
    generatedAt: new Date(),
    referenceNumber: existingKyc.referenceNumber || buildReferenceNumber(req.broker, client),
  };

  await client.save();

  return res.json({
    broker: serializeBroker(req.broker),
    client,
  });
}

module.exports = {
  listBrokerClients,
  getBrokerClient,
  createBrokerClient,
  updateBrokerClient,
  uploadCustomerDocument,
  getCustomerKycPreview,
  generateCustomerKyc,
};
