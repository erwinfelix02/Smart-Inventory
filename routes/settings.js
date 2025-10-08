// routes/settings.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { Admin, Manager, Staff } = require("../models/user");

// Helper: find user in all collections
async function findUserByEmail(email) {
  let user = await Admin.findOne({ email });
  if (!user) user = await Manager.findOne({ email });
  if (!user) user = await Staff.findOne({ email });
  return user;
}

// GET user info
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      user: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone || ""
      }
    });
  } catch (err) {
    console.error("❌ Error fetching settings:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST update profile or password
router.post("/update", async (req, res) => {
  try {
    const { email, phone, currentPassword, newPassword, confirmPassword } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Update phone for manager
    if (user.role.toLowerCase() === "manager" && phone) {
      user.phone = phone;
    }

    // Update password for staff or manager
    if (currentPassword || newPassword || confirmPassword) {
      // Only allow if user has a password field
      if (!user.password) {
        return res.status(400).json({ success: false, message: "Password cannot be updated for this user" });
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: "Please fill out all password fields" });
      }

      // Compare current password
      const isMatch = await bcrypt.compare(currentPassword, user.password).catch(err => {
        console.error("Error comparing password:", err);
        return false;
      });

      if (!isMatch) return res.status(400).json({ success: false, message: "Current password is incorrect" });

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: "New password and confirmation do not match" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.json({ success: true, message: "Profile updated successfully" });

  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
