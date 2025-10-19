const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Alert = require("./alert");

// 🧾 GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ➕ POST add new product
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 🔄 PATCH stock update
router.patch("/:id/stock", async (req, res) => {
  try {
    const { change } = req.body; // e.g. { "change": -2 } or { "change": 10 }
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: change } },
      { new: true }
    );
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
