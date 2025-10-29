const mongoose = require("mongoose");

const StoredAlertSchema = new mongoose.Schema({
  alertId: String,
  type: String,
  name: String,
  severity: String,
  stock: Number,
  createdAt: Date,
  status: String,
  readBy: {   // <-- new field
    admin: { type: Boolean, default: false },
    manager: { type: Boolean, default: false },
    staff: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model("StoredAlert", StoredAlertSchema, "alerts");
