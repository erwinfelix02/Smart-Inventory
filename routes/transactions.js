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


// ------------------------
// GET all transactions with count
// ------------------------
router.get("/", async (req, res) => {
  try {
    // Fetch transactions sorted by most recent
    const transactions = await Transaction.find()
      .populate("product", "name sku price")
      .sort({ date: -1 });

    // Get total count
    const totalCount = await Transaction.countDocuments();

    res.json({ transactions, totalCount });
  } catch (err) {
    console.error("GET /transactions error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ------------------------
// Update transaction status
// ------------------------
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!status) return res.status(400).json({ success: false, message: "Status is required" });

    const statusMap = {
      pending: "Pending",
      completed: "Completed",
      cancelled: "Cancelled"
    };

    status = status.trim().toLowerCase();
    if (!statusMap[status]) return res.status(400).json({ success: false, message: "Invalid status" });

    const updatedTxn = await Transaction.findByIdAndUpdate(
      id,
      { status: statusMap[status] },
      { new: true }
    ).populate("product", "name sku price");

    if (!updatedTxn) return res.status(404).json({ success: false, message: "Transaction not found" });

    res.json({ success: true, transaction: updatedTxn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// ------------------------
// DELETE transaction by ID 
// ------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const txn = await Transaction.findById(id);
    if (!txn) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const product = await Product.findById(txn.product);
    if (product) {
      product.stock += txn.quantity;
      await product.save();
    }

    await txn.deleteOne();

    res.json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("DELETE /transactions/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



module.exports = router;
