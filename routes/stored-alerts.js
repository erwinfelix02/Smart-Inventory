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

// ✅ Mark all alerts as read (including older ones without 'read' field)
router.put("/mark-all-read", async (req, res) => {
  try {
    console.log("🟡 Marking all alerts as read...");

    // Include alerts that either don't have `read` or are explicitly false
    const filter = { $or: [{ read: false }, { read: { $exists: false } }] };
    const update = { $set: { read: true } };

    const result = await StoredAlert.updateMany(filter, update);

    console.log("✅ Updated alerts:", result);

    res.json({
      message: "All alerts marked as read",
      matchedCount: result.matchedCount ?? result.n,
      modifiedCount: result.modifiedCount ?? result.nModified,
    });
  } catch (err) {
    console.error("❌ Error in mark-all-read:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Mark a single alert as read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await StoredAlert.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Alert not found" });

    res.json({ message: "Alert marked as read", alert: updated });
  } catch (err) {
    console.error("❌ Error marking alert as read:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
