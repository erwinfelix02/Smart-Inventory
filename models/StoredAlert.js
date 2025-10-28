// models/StoredAlert.js
const mongoose = require("mongoose");

const StoredAlertSchema = new mongoose.Schema({
  alertId: { type: String, required: true }, // e.g., ALT-1
  type: { type: String, required: true }, // e.g., "Critical Stock"
  name: { type: String, required: true }, // Product name
  severity: { type: String, required: true }, // e.g., "Critical", "Out-of-stock"
  stock: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "New" }, // New, Older, etc.
  read: { type: Boolean, default: false },
});

module.exports = mongoose.model("StoredAlert", StoredAlertSchema, "alerts");
