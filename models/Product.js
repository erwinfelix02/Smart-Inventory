// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String },
    price: { type: Number },
    stock: { type: Number, required: true, default: 0 },
    supplier: { type: String },

    stockHistory: [
      {
        date: { type: Date, default: Date.now },
        stock: { type: Number },
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// 🔹 Virtual property for easy stock status checking
ProductSchema.virtual("status").get(function () {
  if (this.stock === 0) return "No Stock";
  if (this.stock <= 10) return "Low Stock";
  return "In Stock";
});

ProductSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", ProductSchema, "products");
