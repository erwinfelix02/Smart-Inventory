const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { Admin, Manager, Staff } = require("../models/User");
const SystemLog = require("../models/SystemLog");


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

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    const result = await findUserByEmail(email);

    if (!result) {
      await SystemLog.create({ email, status: "failure" });
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const { user, role } = result;

    if (user.isDisabled) {
      await SystemLog.create({ email, status: "failure" });
      return res.status(403).json({ msg: "Your account has been disabled. Contact administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await SystemLog.create({ email, status: "failure" });
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // ✅ Successful login
    await SystemLog.create({ email, status: "success" });

    // Generate verification code etc...
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.codeExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // ✅ Send styled verification email
    await transporter.sendMail({
      from: `"Smart Inventory" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Smart Inventory - Login Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px;">
            <h2 style="color: #007bff; text-align: center;">Smart Inventory Login Verification</h2>
            <p style="font-size: 16px; color: #333;">Hello <strong>${user.fullName || "User"}</strong>,</p>
            <p style="font-size: 15px; color: #555;">
              You are attempting to log in to your Smart Inventory account. Please use the following verification code to complete your login:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #007bff; color: white; font-size: 28px; letter-spacing: 4px; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                ${code}
              </div>
            </div>
            <p style="font-size: 14px; color: #555; text-align: center;">
              This code will expire in <strong>5 minutes</strong>.
            </p>
            <p style="font-size: 14px; color: #777; text-align: center;">
              If you did not attempt to sign in, you can safely ignore this email.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 13px; color: #888; text-align: center;">
              &copy; ${new Date().getFullYear()} Smart Inventory System. All rights reserved.
            </p>
          </div>
        </div>
      `
    });

    res.json({ msg: "Verification code sent", role });

  } catch (err) {
    console.error("Login Error:", err);
    await SystemLog.create({ email: req.body.email, status: "failure" }); // log server error as failure
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
      from: `"Smart Inventory" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Smart Inventory - New Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px;">
            <h2 style="color: #007bff; text-align: center;">New Verification Code</h2>
            <p style="font-size: 16px; color: #333;">Hello <strong>${user.fullName || "User"}</strong>,</p>
            <p style="font-size: 15px; color: #555;">
              Here is your new verification code to complete your Smart Inventory login:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #007bff; color: white; font-size: 28px; letter-spacing: 4px; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                ${code}
              </div>
            </div>
            <p style="font-size: 14px; color: #555; text-align: center;">
              This code will expire in <strong>5 minutes</strong>.
            </p>
            <p style="font-size: 14px; color: #777; text-align: center;">
              If you did not request this, you can safely ignore this email.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 13px; color: #888; text-align: center;">
              &copy; ${new Date().getFullYear()} Smart Inventory System. All rights reserved.
            </p>
          </div>
        </div>
      `
    });

    res.json({ msg: "Verification code resent successfully", role });
  } catch (err) {
    console.error("Resend code error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
