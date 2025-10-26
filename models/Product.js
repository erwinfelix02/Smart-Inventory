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
ProductSchema.pre("save", function (next) {
  // Only generate SKU if it doesn’t exist
  if (!this.sku) {
    // Generate 3 random uppercase letters
    const letters = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");

    // Generate 4 random digits
    const numbers = Math.floor(1000 + Math.random() * 9000); // ensures 4 digits

    this.sku = `${letters}-${numbers}`;
  }
  next();
});


module.exports = mongoose.model("Product", ProductSchema, "products");
