const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { Admin, Manager, Staff } = require("../models/User"); // your schema file path

// 📧 POST /forgot-password/verify-email
router.post("/verify-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    // 🔍 Check in all 3 collections
    let user =
      (await Admin.findOne({ email })) ||
      (await Manager.findOne({ email })) ||
      (await Staff.findOne({ email }));

    if (!user)
      return res.status(404).json({ success: false, message: "No account found with that email." });

    // 🚫 Disabled check (optional)
    if (user.isDisabled)
      return res.status(403).json({ success: false, message: "This account is disabled." });

    // 🧮 Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // expires in 10 mins

    user.verificationCode = verificationCode;
    user.codeExpiry = codeExpiry;
    await user.save();

    // 📤 Send verification email (or console log during dev)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // set in your .env
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Smart Inventory" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Verification Code",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.fullName || "User"},</p>
        <p>Your verification code is:</p>
        <h3 style="color:#007bff">${verificationCode}</h3>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Verification code sent to your email."
    });

  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});

module.exports = router;
