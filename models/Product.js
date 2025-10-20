const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String },
    price: { type: Number },
    stock: { type: Number, required: true, default: 0 },
    supplier: { type: String },
    sku: { type: String, unique: true }, // ✅ Added SKU field

    stockHistory: [
      {
        date: { type: Date, default: Date.now },
        stock: { type: Number },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 🔹 Virtual for stock status
ProductSchema.virtual("status").get(function () {
  if (this.stock === 0) return "No Stock";
  if (this.stock <= 10) return "Low Stock";
  return "In Stock";
});

ProductSchema.set("toJSON", { virtuals: true });

// 🧠 Auto-generate SKU before saving
ProductSchema.pre("save", async function (next) {
  // Only generate SKU if it doesn’t exist
  if (!this.sku && this.name) {
    const prefix = this.name.replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase() || "PRD";

    // Find the latest SKU with same prefix
    const lastProduct = await mongoose.model("Product").findOne({ sku: new RegExp(`^${prefix}-`) })
      .sort({ createdAt: -1 });

    let nextNumber = 2001;
    if (lastProduct && lastProduct.sku) {
      const parts = lastProduct.sku.split("-");
      const lastNum = parseInt(parts[1]);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    this.sku = `${prefix}-${nextNumber}`;
  }
  next();
});

module.exports = mongoose.model("Product", ProductSchema, "products");
