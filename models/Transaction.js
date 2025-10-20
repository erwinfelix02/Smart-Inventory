const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  staffName: { type: String, required: true, trim: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Completed", "Requires Approval"], default: "Pending" } // <- Added
});

// Optional: virtual field for formatted total
transactionSchema.virtual("formattedTotal").get(function () {
  return `₱${this.total.toFixed(2)}`;
});

module.exports = mongoose.model("Transaction", transactionSchema, "transactions");
