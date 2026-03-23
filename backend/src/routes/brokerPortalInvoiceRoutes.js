const express = require("express");
const { getInvoicePreview } = require("../controllers/brokerPortalInvoiceController");

const router = express.Router();

router.get("/preview", getInvoicePreview);

module.exports = router;
