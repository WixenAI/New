const fs = require("fs");
const path = require("path");
const multer = require("multer");

const ALLOWED_ASSET_TYPES = new Set(["logo", "signature", "trademark"]);
const ALLOWED_CUSTOMER_DOCUMENT_TYPES = new Set([
  "aadhaarFront",
  "aadhaarBack",
  "panImage",
  "customerPhoto",
  "customerSignature",
]);
const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

function ensureDir(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
}

ensureDir(uploadsRoot);

const memoryStorage = multer.memoryStorage();

function createImageUpload(allowedTypes, idParam, typeParam) {
  return multer({
    storage: memoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
      const resourceId = req.params[idParam];
      const uploadType = req.params[typeParam];

      if (!resourceId || !allowedTypes.has(uploadType)) {
        return cb(new Error("Invalid upload target."));
      }

      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image uploads are allowed."));
      }

      return cb(null, true);
    },
  });
}

const brokerAssetUpload = createImageUpload(ALLOWED_ASSET_TYPES, "brokerId", "assetType");

const customerDocumentUpload = createImageUpload(ALLOWED_CUSTOMER_DOCUMENT_TYPES, "clientId", "documentType");

function getBrokerUploadDir(brokerId) {
  return path.join(uploadsRoot, "brokers", brokerId);
}

function getCustomerUploadDir(clientId) {
  return path.join(uploadsRoot, "customers", clientId);
}

module.exports = {
  brokerAssetUpload,
  customerDocumentUpload,
  getBrokerUploadDir,
  getCustomerUploadDir,
  uploadsRoot,
  ALLOWED_ASSET_TYPES,
  ALLOWED_CUSTOMER_DOCUMENT_TYPES,
};
