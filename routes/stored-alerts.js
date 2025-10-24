const express = require("express");
const router = express.Router();
const StoredAlert = require("../models/StoredAlert");

// 🟢 POST — Save alert (ignore duplicates)
router.post("/", async (req, res) => {
  console.log("📨 POST /stored-alerts triggered");

  try {
    const { name, stock, status, createdAt } = req.body;

    // Check for existing alert for same product name & stock that isn't resolved
    const existing = await StoredAlert.findOne({
      name,
      status: { $ne: "Resolved" },
    });

    if (existing) {
      console.log("⚠️ Duplicate alert ignored:", existing);
      return res.status(200).json({
        message: "Duplicate alert ignored",
        alert: existing,
      });
    }

    // Otherwise, create new one
    const newAlert = new StoredAlert({
      name,
      stock,
      status: status || "New",
      createdAt: createdAt || new Date(),
    });

    await newAlert.save();
    console.log("✅ Alert saved:", newAlert);
    res.status(201).json(newAlert);
  } catch (err) {
    console.error("❌ Error saving alert:", err);
    res.status(400).json({ message: err.message });
  }
});

// 🟢 GET — Fetch all stored alerts
router.get("/", async (req, res) => {
  try {
    const alerts = await StoredAlert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
