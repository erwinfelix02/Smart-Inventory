const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String },
    price: { type: Number },
    stock: { type: Number, required: true, default: 0 },
    supplier: { type: String },
    sku: { type: String, unique: true },
    stockHistory: [
      {
        date: { type: Date, default: Date.now },
        change: { type: Number },      // how much stock changed (+/-)
        stockAfter: { type: Number },  // resulting stock after change
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate SKU before saving
ProductSchema.pre("save", function (next) {
  if (!this.sku) {
    const letters = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");
    const numbers = Math.floor(1000 + Math.random() * 9000);
    this.sku = `${letters}-${numbers}`;
  }
  next();
});

// Normalize name to lowercase for uniqueness
ProductSchema.pre("save", function (next) {
  if (this.isModified("name")) this.name = this.name.toLowerCase();
  next();
});

// Log stockHistory only


ProductSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.stock !== undefined) {
    const product = await this.model.findOne(this.getQuery());
    if (product) {
      update.$push = update.$push || {};
      update.$push.stockHistory = { change: update.stock, stockAfter: update.stock };
    }
  }
  this.setUpdate(update);
  next();
});

// Case-insensitive unique index on name
ProductSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

module.exports = mongoose.model("Product", ProductSchema, "products");
