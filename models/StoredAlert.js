// models/StoredAlert.js
const mongoose = require("mongoose");

const StoredAlertSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true },
  status: { type: String, default: "New" },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false } // 🆕 Add this
});

// ✅ Use the same collection
module.exports = mongoose.model("StoredAlert", StoredAlertSchema, "alerts");
