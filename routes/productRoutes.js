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



// GET low-stock products based on status field
router.get("/low-stock", async (req, res) => {
  try {
    // Fetch products where status is "low" in your inventory management
    const products = await Product.find({ status: "low" });

    // Optional: sort by stock ascending so lowest stock shows first
    products.sort((a, b) => a.stock - b.stock);

    res.json(products);
  } catch (err) {
    console.error("Error fetching low stock products:", err);
    res.status(500).json({ message: err.message });
  }
});





// ============================
// ✅ PUT /products/:id — update existing product
// ============================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ➕ POST Add New Product (Auto-generate SKU)
router.post("/", async (req, res) => {
  try {
    const { name, category, stock, price, supplier } = req.body;

    if (!name) return res.status(400).json({ message: "Product name is required." });

    // Check if product with same name exists (case-insensitive)
    const existing = await Product.findOne({ name: name.toLowerCase() }).collation({ locale: "en", strength: 2 });
    if (existing) return res.status(400).json({ message: "Product with this name already exists." });

    const product = new Product({ name, category, stock, price, supplier });
    await product.save();

    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate product detected." });
    }
    res.status(400).json({ message: err.message });
  }
});



module.exports = router;
