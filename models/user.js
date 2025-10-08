const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: "Unknown" },
  role: { type: String, required: true }, // Admin / Manager / Staff
  phone: { type: String, default: "" },
  verificationCode: String,
  codeExpiry: Date, 
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null }
});

const Admin = mongoose.model("Admin", userSchema, "admins");
const Manager = mongoose.model("Manager", userSchema, "managers");
const Staff = mongoose.model("Staff", userSchema, "staff");

module.exports = { Admin, Manager, Staff };
