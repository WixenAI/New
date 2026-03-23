const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    brokerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Broker",
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    clientCode: { type: String, required: true, trim: true, uppercase: true },
    idCode: { type: String, required: true, trim: true, uppercase: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    kyc: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      fatherName: { type: String, trim: true },
      dateOfBirth: { type: Date },
      gender: {
        type: String,
        enum: ["male", "female", "other", ""],
        default: "",
      },
      applicationDate: { type: Date },
      initialDeposit: { type: Number, default: 0 },
      aadhaarNumber: { type: String, trim: true },
      aadhaarFrontUrl: { type: String, trim: true },
      aadhaarFrontPublicId: { type: String, trim: true },
      aadhaarBackUrl: { type: String, trim: true },
      aadhaarBackPublicId: { type: String, trim: true },
      panNumber: { type: String, trim: true, uppercase: true },
      panImageUrl: { type: String, trim: true },
      panImagePublicId: { type: String, trim: true },
      customerPhotoUrl: { type: String, trim: true },
      customerPhotoPublicId: { type: String, trim: true },
      customerSignatureUrl: { type: String, trim: true },
      customerSignaturePublicId: { type: String, trim: true },
      status: {
        type: String,
        enum: ["incomplete", "ready", "generated"],
        default: "incomplete",
      },
      referenceNumber: { type: String, trim: true, uppercase: true },
      generatedAt: { type: Date },
    },
    segment: {
      type: String,
      enum: ["intraday", "delivery", "futures", "options", "commodity"],
      default: "intraday",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

clientSchema.index({ brokerId: 1, clientCode: 1 }, { unique: true });
clientSchema.index({ brokerId: 1, idCode: 1 }, { unique: true });

module.exports = mongoose.model("Client", clientSchema);
