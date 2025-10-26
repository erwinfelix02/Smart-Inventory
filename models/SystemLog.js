const mongoose = require("mongoose");

const systemLogSchema = new mongoose.Schema({
  email: { type: String, required: true },
  action: { type: String, default: "login" },  // ADD THIS
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["success", "failure"], required: true }
});

module.exports = mongoose.model("SystemLog", systemLogSchema, "systemlogs");
