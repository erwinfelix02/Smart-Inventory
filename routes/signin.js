const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { Admin, Manager, Staff } = require("../models/user");

const router = express.Router();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to find user in all collections
async function findUserByEmail(email) {
  const query = { email: { $regex: `^${email.trim()}$`, $options: "i" } };

  let user = await Admin.findOne(query);
  if (user) return { user, role: "Admin" };

  user = await Manager.findOne(query);
  if (user) return { user, role: "Manager" };

  user = await Staff.findOne(query);
  if (user) return { user, role: "Staff" };

  return null;
}

// ---------------- LOGIN ROUTE ----------------
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    const result = await findUserByEmail(email);

    // 🔹 Unified error message for invalid email or password
    if (!result) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const { user, role } = result;

    // ❌ Check if account is disabled
    if (user.isDisabled) {
      return res.status(403).json({ msg: "Your account has been disabled. Contact administrator." });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid email or password" });

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.codeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    await user.save();

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your Verification Code",
      text: `Your code is ${code}`,
    });

    res.json({ msg: "Verification code sent", role });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ---------------- VERIFY ROUTE ----------------
router.post("/verify", async (req, res) => {
  try {
    const { email, code } = req.body;
    const result = await findUserByEmail(email);

    if (!result) return res.status(400).json({ msg: "User not found" });

    const { user, role } = result;

    // ❌ Check if account is disabled
    if (user.isDisabled) {
      return res.status(403).json({ msg: "Your account has been disabled. Contact administrator." });
    }

    if (user.verificationCode !== code || new Date() > user.codeExpiry) {
      return res.status(400).json({ msg: "Invalid or expired code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.codeExpiry = null;
    await user.save();

    res.json({
      msg: "Verification successful",
      user: {
        email: user.email,
        fullName: user.fullName,
        role,
      },
    });
  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------- RESEND VERIFICATION CODE ----------------
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await findUserByEmail(email);
    if (!result) return res.status(400).json({ msg: "User not found" });

    const { user, role } = result;

    // ❌ Prevent sending code if account is disabled
    if (user.isDisabled) {
      return res.status(403).json({ msg: "Your account has been disabled. Contact administrator." });
    }

    // Generate new 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.codeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    await user.save();

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your Verification Code",
      text: `Your new code is ${code}`,
    });

    res.json({ msg: "Verification code resent successfully", role });
  } catch (err) {
    console.error("Resend code error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
