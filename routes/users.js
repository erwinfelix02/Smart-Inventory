const express = require("express");
const router = express.Router();
const { Admin, Manager, Staff } = require("../models/user");
const bcrypt = require("bcryptjs");


// =========================
// Fetch all users
// =========================
router.get("/", async (req, res) => {
  const { email } = req.query;
  try {
    const admins = await Admin.find().lean();
    const managers = await Manager.find().lean();
    const staff = await Staff.find().lean();

    const allUsers = [
      ...admins.map(u => ({ ...u, role: "Admin" })),
      ...managers.map(u => ({ ...u, role: "Inventory Manager" })),
      ...staff.map(u => ({ ...u, role: "Staff" })),
    ];

    if (email) {
      const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      return res.status(200).json(user ? [user] : []);
    }

    res.status(200).json(allUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

// =========================
// Add Admin
// =========================
router.post("/admins", async (req, res) => {
  try {
    const { fullName, email, phone, isVerified, lastLogin } = req.body;
    const user = new Admin({ fullName, email, phone, role: "Admin", password: "default123", isVerified, lastLogin });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding admin:", err);
    res.status(500).json({ message: "Failed to add admin" });
  }
});

// =========================
// Add Manager
// =========================
router.post("/managers", async (req, res) => {
  try {
    const { fullName, email, phone, isVerified, lastLogin } = req.body;
    const user = new Manager({ fullName, email, phone, role: "Inventory Manager", password: "default123", isVerified, lastLogin });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding manager:", err);
    res.status(500).json({ message: "Failed to add manager" });
  }
});

// =========================
// Add Staff
// =========================
router.post("/staff", async (req, res) => {
  try {
    const { fullName, email, phone, isVerified, lastLogin } = req.body;
    const user = new Staff({ fullName, email, phone, role: "Staff", password: "default123", isVerified, lastLogin });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding staff:", err);
    res.status(500).json({ message: "Failed to add staff" });
  }
});


// ✅ Put this BEFORE any routes like "/:id"
router.put("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    console.log("🔍 Reset request for:", email);

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: "Email and new password are required." });
    }

    let user =
      (await Admin.findOne({ email })) ||
      (await Manager.findOne({ email })) ||
      (await Staff.findOne({ email }));

    if (!user) {
      console.log("❌ No user found for:", email);
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.password = newPassword;
    await user.save();

    console.log("✅ Password updated successfully for:", email);
    return res.status(200).json({ success: true, message: "Password reset successful." });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});


// =========================
// Update user
// =========================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, role, isVerified, lastLogin } = req.body;

  try {
    let user =
      (await Admin.findById(id)) ||
      (await Manager.findById(id)) ||
      (await Staff.findById(id));

    if (!user) return res.status(404).json({ message: "User not found" });

    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    user.role = role
  ? role.trim().replace(/\s+/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  : user.role;

    user.isVerified = isVerified ?? user.isVerified;
    user.lastLogin = lastLogin ?? user.lastLogin;

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// =========================
// Toggle Active / Disabled
// =========================
router.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { isDisabled } = req.body; // assume Boolean from frontend

  try {
    // Find the user in any of the collections
    let user =
      (await Admin.findById(id)) ||
      (await Manager.findById(id)) ||
      (await Staff.findById(id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update status
    user.isDisabled = isDisabled;
    await user.save();

    res.status(200).json({
      message: `User is now ${isDisabled ? "Disabled" : "Active"}`,
      user,
    });
  } catch (err) {
    console.error("Error toggling user status:", err);
    res.status(500).json({ message: "Failed to update user status" });
  }
});




module.exports = router;
