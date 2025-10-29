const mongoose = require("mongoose");

const StoredAlertSchema = new mongoose.Schema({
  alertId: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  severity: { type: String, required: true },
  stock: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "New" },
  readBy: {
    admin: { type: Boolean, default: false },
    manager: { type: Boolean, default: false },
    staff: { type: Boolean, default: false },
  },
});

module.exports = mongoose.model("StoredAlert", StoredAlertSchema, "alerts");
