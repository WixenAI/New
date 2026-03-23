const fs = require("fs/promises");
const path = require("path");
const Broker = require("../models/Broker");
const Client = require("../models/Client");
const Trade = require("../models/Trade");
const { destroyImages, uploadImageBuffer } = require("../config/cloudinary");
const { ALLOWED_ASSET_TYPES, getBrokerUploadDir, getCustomerUploadDir } = require("../config/upload");

const BROKER_ASSET_PUBLIC_ID_FIELD_MAP = {
  logo: "logoPublicId",
  signature: "signaturePublicId",
  trademark: "trademarkPublicId",
};

const CUSTOMER_KYC_PUBLIC_ID_FIELDS = [
  "aadhaarFrontPublicId",
  "aadhaarBackPublicId",
  "panImagePublicId",
  "customerPhotoPublicId",
  "customerSignaturePublicId",
];

function getBrokerAssetPublicId(brokerId, assetType) {
  return `broker-platform/brokers/${brokerId}/${assetType}`;
}

function getBrokerAssetPublicIds(broker) {
  const branding = broker?.branding?.toObject?.() || broker?.branding || {};
  return Object.values(BROKER_ASSET_PUBLIC_ID_FIELD_MAP)
    .map((field) => branding[field])
    .filter(Boolean);
}

function getClientAssetPublicIds(client) {
  const kyc = client?.kyc?.toObject?.() || client?.kyc || {};
  return CUSTOMER_KYC_PUBLIC_ID_FIELDS.map((field) => kyc[field]).filter(Boolean);
}

async function deleteLegacyUpload(filePath) {
  if (!filePath || !String(filePath).startsWith("/uploads/")) {
    return;
  }

  const absolutePath = path.join(__dirname, "..", "..", filePath.replace(/^\//, ""));
  await fs.unlink(absolutePath).catch(() => {});
}

function buildBrokerPayload(input = {}, existingBroker = null) {
  const existingContact = existingBroker?.contact?.toObject?.() || existingBroker?.contact || {};
  const existingBranding = existingBroker?.branding?.toObject?.() || existingBroker?.branding || {};
  const existingDocuments = existingBroker?.documents?.toObject?.() || existingBroker?.documents || {};

  const name = input.name ?? existingBroker?.name ?? "";

  return {
    ...input,
    tokenId: input.tokenId ? String(input.tokenId).trim().toUpperCase() : existingBroker?.tokenId,
    contact: input.contact
      ? {
          email: "",
          phone: "",
          website: "",
          supportDesk: "",
          ...existingContact,
          ...input.contact,
        }
      : existingBroker
        ? undefined
        : {
            email: "",
            phone: "",
            website: "",
            supportDesk: "",
          },
    branding: input.branding
      ? {
          brokerageHouseName: name || "Brokerage House",
          logoText: (name || "BR").slice(0, 2).toUpperCase(),
          shortName: name || "Broker",
          primaryColor: "#18b5d6",
          accentColor: "#87dff0",
          surfaceTint: "#f2fcff",
          headerTone: "A clean operating base for a modern broker workspace.",
          signatureLabel: "Authorized Signature",
          trademarkLabel: "Registered Mark",
          ...existingBranding,
          ...input.branding,
        }
      : existingBroker
        ? undefined
        : {
            brokerageHouseName: name || "Brokerage House",
            logoText: (name || "BR").slice(0, 2).toUpperCase(),
            shortName: name || "Broker",
            primaryColor: "#18b5d6",
            accentColor: "#87dff0",
            surfaceTint: "#f2fcff",
            headerTone: "A clean operating base for a modern broker workspace.",
            signatureLabel: "Authorized Signature",
            trademarkLabel: "Registered Mark",
          },
    documents: input.documents
      ? {
          templateKey: "official-default",
          statementPrefix: "ST",
          statementTitle: "Closed Trade Statement",
          statementSubtitle: "Portfolio P&L Report",
          clientLabel: "Client ID",
          receiptPrefix: "RCP",
          invoicePrefix: "PVT",
          footerText: "This is a system-generated statement and does not require a signature.",
          supportText: "For support, contact your broker operations desk. All figures are in INR.",
          disclaimer: "Brokerage, statutory charges and trade values are subject to exchange rules and broker policy.",
          showSignature: true,
          showTrademark: false,
          ...existingDocuments,
          ...input.documents,
        }
      : existingBroker
        ? undefined
        : {
            templateKey: "official-default",
            statementPrefix: "ST",
            statementTitle: "Closed Trade Statement",
            statementSubtitle: "Portfolio P&L Report",
            clientLabel: "Client ID",
            receiptPrefix: "RCP",
            invoicePrefix: "PVT",
            footerText: "This is a system-generated statement and does not require a signature.",
            supportText: "For support, contact your broker operations desk. All figures are in INR.",
            disclaimer: "Brokerage, statutory charges and trade values are subject to exchange rules and broker policy.",
            showSignature: true,
            showTrademark: false,
          },
  };
}

function removeUndefinedFields(payload) {
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
}

async function listBrokers(req, res) {
  const brokers = await Broker.find().sort({ createdAt: 1 });
  res.json(brokers);
}

async function getBroker(req, res) {
  const broker = await Broker.findById(req.params.brokerId);
  if (!broker) {
    return res.status(404).json({ message: "Broker not found." });
  }

  res.json(broker);
}

async function createBroker(req, res) {
  const payload = removeUndefinedFields(buildBrokerPayload(req.body));
  const broker = await Broker.create(payload);
  res.status(201).json(broker);
}

async function updateBroker(req, res) {
  const existingBroker = await Broker.findById(req.params.brokerId);
  if (!existingBroker) {
    return res.status(404).json({ message: "Broker not found." });
  }

  const payload = removeUndefinedFields(buildBrokerPayload(req.body, existingBroker));
  const broker = await Broker.findByIdAndUpdate(req.params.brokerId, payload, {
    new: true,
    runValidators: true,
  });

  res.json(broker);
}

async function updateBrokerAsset(req, res) {
  const { brokerId, assetType } = req.params;
  const broker = await Broker.findById(brokerId);

  if (!broker) {
    return res.status(404).json({ message: "Broker not found." });
  }

  if (!ALLOWED_ASSET_TYPES.has(assetType)) {
    return res.status(400).json({ message: "Invalid asset type." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const assetKey = `${assetType}Url`;
  const publicIdKey = BROKER_ASSET_PUBLIC_ID_FIELD_MAP[assetType];
  const previousFile = broker.branding?.[assetKey];
  const uploadedAsset = await uploadImageBuffer(req.file, {
    publicId: getBrokerAssetPublicId(brokerId, assetType),
  });

  broker.branding = {
    ...(broker.branding?.toObject?.() || broker.branding || {}),
    [assetKey]: uploadedAsset.secureUrl,
    [publicIdKey]: uploadedAsset.publicId,
  };

  await broker.save();

  await deleteLegacyUpload(previousFile);

  return res.json(broker);
}

async function deleteBroker(req, res) {
  const { brokerId } = req.params;
  const broker = await Broker.findById(brokerId);

  if (!broker) {
    return res.status(404).json({ message: "Broker not found." });
  }

  const clients = await Client.find({ brokerId }).select("kyc");
  const publicIds = [
    ...getBrokerAssetPublicIds(broker),
    ...clients.flatMap((client) => getClientAssetPublicIds(client)),
  ];

  await destroyImages(publicIds);

  await Promise.all([
    Client.deleteMany({ brokerId }),
    Trade.deleteMany({ brokerId }),
    Broker.findByIdAndDelete(brokerId),
    fs.rm(getBrokerUploadDir(brokerId), { recursive: true, force: true }).catch(() => {}),
    ...clients.map((client) => fs.rm(getCustomerUploadDir(client._id.toString()), { recursive: true, force: true }).catch(() => {})),
  ]);

  res.json({ message: "Broker and related records deleted." });
}

module.exports = {
  listBrokers,
  getBroker,
  createBroker,
  updateBroker,
  updateBrokerAsset,
  deleteBroker,
};
