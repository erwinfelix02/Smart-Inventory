const mongoose = require("mongoose");

const StoredAlertSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true },
  status: { type: String, default: "New" },
  createdAt: { type: Date, default: Date.now },
});

// ✅ This will save into the "alerts" collection
module.exports = mongoose.model("StoredAlert", StoredAlertSchema, "alerts");
