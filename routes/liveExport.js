const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const Alert = require("../models/Alert");
const XLSX = require("xlsx");

// GET all data as Excel for Tableau
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    const transactions = await Transaction.find()
      .populate("product", "name sku price")
      .where("status").equals("Completed"); // only completed transactions
    const alerts = await Alert.find().populate("productId", "name");

    // ===== Products sheet (include stock history) =====
    const wsProducts = XLSX.utils.json_to_sheet(
      products.flatMap(p =>
        p.stockHistory.length > 0
          ? p.stockHistory.map(h => ({
              Name: p.name,
              SKU: p.sku,
              CurrentStock: p.stock,
              Price: p.price,
              StockChange: h.change,
              StockAfter: h.stockAfter,
              Date: h.date ? new Date(h.date).toLocaleString() : ""
            }))
          : [{
              Name: p.name,
              SKU: p.sku,
              CurrentStock: p.stock,
              Price: p.price,
              StockChange: 0,
              StockAfter: p.stock,
              Date: ""
            }]
      )
    );

    // ===== Transactions sheet =====
    const wsTransactions = XLSX.utils.json_to_sheet(
      transactions.map(t => ({
        TransactionID: t._id.toString(),
        ProductID: t.product?._id.toString() || "",
        ProductName: t.product?.name || "Unknown",
        SKU: t.product?.sku || "",
        Quantity: t.quantity || 0,
        UnitPrice: t.product?.price || 0,
        Total: (t.quantity || 0) * (t.product?.price || 0),
        Status: t.status,
        Date: t.date ? new Date(t.date).toLocaleString() : ""
      }))
    );

    // ===== Alerts sheet =====
    const wsAlerts = XLSX.utils.json_to_sheet(
      alerts.map(a => ({
        AlertID: a._id.toString(),
        Name: a.name,
        ProductID: a.productId?._id.toString() || "",
        Stock: a.stock,
        Type: a.type,
        Severity: a.severity,
        Status: a.status,
        CreatedAt: a.createdAt ? new Date(a.createdAt).toLocaleString() : ""
      }))
    );

    // ===== Create workbook and append sheets =====
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsProducts, "Products");
    XLSX.utils.book_append_sheet(wb, wsTransactions, "Transactions");
    XLSX.utils.book_append_sheet(wb, wsAlerts, "Alerts");

    // ===== Write workbook to buffer =====
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // ===== Send as downloadable file =====
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=live_export_report.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buf);

  } catch (err) {
    console.error("❌ Failed to export live data:", err);
    res.status(500).json({ message: "Failed to fetch live data" });
  }
});

module.exports = router;
