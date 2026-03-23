const express = require("express");
const {
  listBrokerClients,
  getBrokerClient,
  createBrokerClient,
  updateBrokerClient,
  uploadCustomerDocument,
  getCustomerKycPreview,
  generateCustomerKyc,
} = require("../controllers/brokerPortalClientController");
const { customerDocumentUpload } = require("../config/upload");

const router = express.Router();

router.get("/", listBrokerClients);
router.post("/", createBrokerClient);
router.post("/:clientId/documents/:documentType", customerDocumentUpload.single("file"), uploadCustomerDocument);
router.get("/:clientId/kyc-preview", getCustomerKycPreview);
router.post("/:clientId/generate-kyc", generateCustomerKyc);
router.get("/:clientId", getBrokerClient);
router.patch("/:clientId", updateBrokerClient);

module.exports = router;
