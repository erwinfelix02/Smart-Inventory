const mongoose = require("mongoose");

const SystemSettingsSchema = new mongoose.Schema({
  business_name: String,
  address: String,
  currency: String,
  language: String,
  low_stock_threshold: { type: Number, default: 10 },
  critical_stock_threshold: { type: Number, default: 5 },
  warning_stock_threshold: { type: Number, default: 15 },
  recipients: [String]
}); 

module.exports = mongoose.model("SystemSettings", SystemSettingsSchema);
