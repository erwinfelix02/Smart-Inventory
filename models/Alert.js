// models/Alert.js
const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true }, // product name
  type: { type: String, default: "Low Stock" },
  severity: { type: String, default: "Warning" },
  status: { type: String, default: "New" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Alert", AlertSchema);
