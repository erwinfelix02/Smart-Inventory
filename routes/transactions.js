const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Import models
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");

// ------------------------
// GET all transactions (recent first)
// ------------------------
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("product", "name sku price")
      .sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    console.error("GET /transactions error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ------------------------
// POST new transaction (no session required)
// ------------------------
router.post("/", async (req, res) => {
  try {
    // ✅ Get staff name directly from request body (frontend)
    const { staffName, productId, customerName, quantity, discount, tax } = req.body;

    if (!staffName) {
      return res.status(400).json({ success: false, message: "Missing staff name" });
    }

    if (!productId || !customerName || !quantity) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} item(s) available` });
    }

    // Calculate totals
    const subtotal = product.price * quantity;
    const discountAmount = subtotal * ((discount || 0) / 100);
    const taxAmount = (subtotal - discountAmount) * ((tax || 0) / 100);
    const total = subtotal - discountAmount + taxAmount;

    // Deduct stock
    product.stock -= quantity;
    await product.save();

    // Save transaction with default status "Pending"
    const transaction = new Transaction({
      customerName,
      staffName,
      product: product._id,
      quantity,
      unitPrice: product.price,
      discount: discount || 0,
      tax: tax || 0,
      total,
      status: "Pending"
    });

    await transaction.save();

    const populatedTransaction = await transaction.populate("product", "name sku price");

    res.json({ success: true, transaction: populatedTransaction });
  } catch (err) {
    console.error("POST /transactions error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});




document.querySelector(".cards .card:nth-child(3) .count").textContent = stats.pendingApprovals;

module.exports = router;
