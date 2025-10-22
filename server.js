require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
// Serve frontend
app.use(express.static(path.join(__dirname, "Landing Page")));
app.use("/Contents", express.static(path.join(__dirname, "Contents")));
app.use(express.static(path.join(__dirname, "Contents")));
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
 res.sendFile(path.join(__dirname, "Landing Page", "signin.html"));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// Import routes
const usersRoute = require("./routes/users");
const signinRoutes = require("./routes/signin");
const settingsRoutes = require("./routes/settings");
const userManagementRoutes = require("./routes/user-management");
const productRoutes = require("./routes/productRoutes");
const alertRoute = require("./routes/alert");
const systemsettingsRoutes = require("./routes/system-settings");
const transactionsRoutes = require("./routes/transactions");
const salesRoutes = require("./routes/sales");



app.use("/sales", salesRoutes);
app.use("/transactions", transactionsRoutes);
app.use("/system-settings", systemsettingsRoutes);
app.use("/alert", alertRoute);
app.use("/users", usersRoute);
app.use("/auth", signinRoutes);     // login & verify
app.use("/products", productRoutes);
app.use("/settings", settingsRoutes); // fetch settings info
app.use("/users", userManagementRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
});
