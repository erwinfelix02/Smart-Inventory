const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SystemLog = require("../models/SystemLog");

// Schema
const systemSettingsSchema = new mongoose.Schema({
  business_name: { type: String, default: "" },
  address: { type: String, default: "" },
  currency: { type: String, default: "PHP" },
  language: { type: String, default: "English" },
  low_stock_threshold: { type: Number, default: 10, min: 0 },
  critical_stock_threshold: { type: Number, default: 10, min: 0 },
  warning_stock_threshold: { type: Number, default: 10, min: 0 },
  recipients: { type: [String], default: ["admins", "managers", "staff"] }
});

// ✅ Force the exact collection name to "system_settings"
const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema, "system_settings");

// GET settings
router.get("/", async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = new SystemSettings();
      await settings.save();
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST update settings
// POST update settings
router.post("/update", async (req, res) => {
  try {
    const data = req.body;

    // Ensure numeric fields
    ["low_stock_threshold", "critical_stock_threshold", "warning_stock_threshold"].forEach(field => {
      if (data[field] !== undefined) data[field] = Number(data[field]);
    });

    let settings = await SystemSettings.findOne();
    if (!settings) settings = new SystemSettings(data);
    else {
      settings.set({
        business_name: data.business_name ?? settings.business_name,
        address: data.address ?? settings.address,
        currency: data.currency ?? settings.currency,
        language: data.language ?? settings.language,
        low_stock_threshold: data.low_stock_threshold ?? settings.low_stock_threshold,
        critical_stock_threshold: data.critical_stock_threshold ?? settings.critical_stock_threshold,
        warning_stock_threshold: data.warning_stock_threshold ?? settings.warning_stock_threshold,
        recipients: Array.isArray(data.recipients) ? data.recipients : settings.recipients
      });
    }

    await settings.save();

    // ✅ Use email from request body if provided
    const userEmail = req.body.userEmail || "Unknown User";

    await SystemLog.create({
      action: "Update Settings",
      email: userEmail, // this will now match the sidebar user
      status: "success"
    });

    res.json({ message: "Settings updated successfully", settings });

  } catch (err) {
    const userEmail = req.body.userEmail || "Unknown User";

    await SystemLog.create({
      action: "Update Settings",
      email: userEmail,
      status: "failed"
    });

    res.status(500).json({ error: err.message });
  }
});




// GET system logs
router.get("/logs", async (req, res) => {
  try {
    const logs = await SystemLog.find().sort({ date: -1 }).limit(50); // latest 50 logs
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
