// routes/stored-alerts.js
const express = require("express");
const router = express.Router();
const StoredAlert = require("../models/StoredAlert");


// 🟢 POST — Save alert (ignore exact duplicates with same date/time)
router.post("/", async (req, res) => {
  console.log("📨 POST /stored-alerts triggered");

  try {
    const { name, stock, type, severity, createdAt } = req.body;
    const now = new Date();
    const alertDate = new Date(createdAt || now);

    // 🧩 Find any existing alert within the same exact minute
    const startOfMinute = new Date(alertDate);
    startOfMinute.setSeconds(0, 0);
    const endOfMinute = new Date(alertDate);
    endOfMinute.setSeconds(59, 999);

    const existing = await StoredAlert.findOne({
      name,
      type,
      createdAt: { $gte: startOfMinute, $lte: endOfMinute },
    });

    if (existing) {
      console.log("⚠️ Duplicate alert ignored (same date/time):", existing);
      return res.status(200).json({
        message: "Duplicate alert ignored (same date/time)",
        alert: existing,
      });
    }

    // 🧩 Get next Alert ID (e.g., ALT-6)
    const lastAlert = await StoredAlert.findOne().sort({ createdAt: -1 });
    const nextId = lastAlert
      ? `ALT-${parseInt(lastAlert.alertId.split("-")[1]) + 1}`
      : "ALT-1";

    // 🧩 Calculate status (based on age)
    const diffDays = Math.floor((now - alertDate) / (1000 * 60 * 60 * 24));
    let status = "New";
    if (diffDays === 1) status = "1 day ago";
    else if (diffDays > 1 && diffDays <= 6) status = `${diffDays} days ago`;
    else if (diffDays >= 7 && diffDays <= 13) status = "1 week ago";
    else if (diffDays >= 14) status = "Older";

    // 🧩 Save new alert
    const newAlert = new StoredAlert({
      alertId: nextId,
      type,
      name,
      severity,
      stock,
      createdAt: alertDate,
      status,
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

// 🟢 GET — Fetch all unread alerts only
router.get("/unread", async (req, res) => {
  try {
    const { role } = req.query; // role passed from frontend

    if (!role || !["admin", "manager", "staff"].includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const filter = {};
    filter[`readBy.${role.toLowerCase()}`] = false;

    const unreadAlerts = await StoredAlert.find(filter).sort({ createdAt: -1 });
    res.json(unreadAlerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// ✅ Mark all alerts as read
router.put("/mark-all-read", async (req, res) => {
  try {
    const { role } = req.body; // role must be sent from frontend

    if (!role || !["admin", "manager", "staff"].includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const update = {};
    update[`readBy.${role.toLowerCase()}`] = true;

    const result = await StoredAlert.updateMany(
      { $or: [{ [`readBy.${role.toLowerCase()}`]: false }, { [`readBy.${role.toLowerCase()}`]: { $exists: false } }] },
      { $set: update }
    );

    res.json({
      message: `All alerts marked as read for ${role}`,
      matchedCount: result.matchedCount ?? result.n,
      modifiedCount: result.modifiedCount ?? result.nModified,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Mark a single alert as read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // role should be "admin", "manager", or "staff"

    if (!role || !["admin", "manager", "staff"].includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const update = {};
    update[`readBy.${role.toLowerCase()}`] = true;

    const updated = await StoredAlert.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Alert not found" });

    res.json({ message: `Alert marked as read by ${role}`, alert: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
