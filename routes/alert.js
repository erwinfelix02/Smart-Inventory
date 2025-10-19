// routes/alert.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// 🔹 GET alerts dynamically (no alerts collection needed)
router.get("/", async (req, res) => {
  try {
    // Find products with stock ≤ 10
    const products = await Product.find({ stock: { $lte: 10 } });
    console.log("🧾 Products found with low stock:", products.length);

    // Map each product into an alert-like structure
    const alerts = products.map((p) => ({
      _id: p._id,
      name: p.name,
      type: p.stock === 0 ? "No Stock" : "Low Stock",
      severity: p.stock === 0 ? "Critical" : "Warning",
      status: "New",
      createdAt: p.updatedAt || new Date(),
      stock: p.stock,
    }));

    res.json(alerts);
  } catch (err) {
    console.error("❌ Error fetching alerts:", err);
    res.status(500).json({ message: "Error fetching alerts" });
  }
});

module.exports = router;
