const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: "Unknown" },
  role: { type: String, required: true }, // Admin / Manager / Staff
  phone: { type: String, default: "" },
  verificationCode: String,
  codeExpiry: Date,
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },
  isDisabled: { type: Boolean, default: false }// Add this if you want to track active/disabled
});

// ✅ Pre-save hook to hash password automatically
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next(); // only hash if password changed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Admin = mongoose.model("Admin", userSchema, "admins");
const Manager = mongoose.model("Manager", userSchema, "managers");
const Staff = mongoose.model("Staff", userSchema, "staff");

module.exports = { Admin, Manager, Staff };
