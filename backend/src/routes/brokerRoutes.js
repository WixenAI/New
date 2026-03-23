const express = require("express");
const {
  listBrokers,
  getBroker,
  createBroker,
  updateBroker,
  updateBrokerAsset,
  deleteBroker,
} = require("../controllers/brokerController");
const { brokerAssetUpload } = require("../config/upload");

const router = express.Router();

router.get("/", listBrokers);
router.post("/", createBroker);
router.post("/:brokerId/assets/:assetType", brokerAssetUpload.single("file"), updateBrokerAsset);
router.get("/:brokerId", getBroker);
router.patch("/:brokerId", updateBroker);
router.delete("/:brokerId", deleteBroker);

module.exports = router;
