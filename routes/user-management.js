const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { Admin, Manager, Staff } = require("../models/user");

// Fetch all users from all collections
router.get("/", async (req, res) => {
  try {
    // Fetch users from each collection
    const admins = await Admin.find().lean();
    const managers = await Manager.find().lean();
    const staff = await Staff.find().lean();

    // Combine all users into one array
    const allUsers = [
      ...admins.map(u => ({
        _id: u._id,
        fullName: u.fullName || "Unknown",
        email: u.email,
        role: "Admin",
        isVerified: u.isVerified,
        lastLogin: u.lastLogin || "N/A",
      })),
      ...managers.map(u => ({
        _id: u._id,
        fullName: u.fullName || "Unknown",
        email: u.email,
        role: "Inventory Manager",
        isVerified: u.isVerified,
        lastLogin: u.lastLogin || "N/A",
      })),
      ...staff.map(u => ({
        _id: u._id,
        fullName: u.fullName || "Unknown",
        email: u.email,
        role: "Staff",
        isVerified: u.isVerified,
        lastLogin: u.lastLogin || "N/A",
      })),
    ];

    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

router.post("/admins", async (req, res) => {
  try {
    const { fullName, email, role, isVerified, lastLogin, password } = req.body;

    // ✅ Use provided password or default
    const plainPassword = password || "default123";

    // ✅ Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const user = new Admin({
      fullName,
      email,
      role: "Admin",
      password: hashedPassword,
      isVerified,
      lastLogin
    });

    await user.save();
    res.status(201).json({
      message: "Admin created successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    console.error("Error adding admin:", err);
    res.status(500).json({ message: "Failed to add admin" });
  }
});


router.post("/managers", async (req, res) => {
  try {
    const { fullName, email, role, isVerified, lastLogin, password } = req.body;

    // Use provided password or default
    const plainPassword = password || "default123";

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const user = new Manager({
      fullName,
      email,
      role: "Inventory Manager",
      password: hashedPassword,
      isVerified,
      lastLogin
    });

    await user.save();

    res.status(201).json({
      message: "Manager created successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    console.error("Error adding manager:", err);
    res.status(500).json({ message: "Failed to add manager" });
  }
});


router.post("/staff", async (req, res) => {
  try {
    const { fullName, email, role, isVerified, lastLogin, password } = req.body;

    const plainPassword = password || "default123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const user = new Staff({
      fullName,
      email,
      role: "Staff",
      password: hashedPassword,
      isVerified,
      lastLogin
    });

    await user.save();

    res.status(201).json({
      message: "Staff created successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    console.error("Error adding staff:", err);
    res.status(500).json({ message: "Failed to add staff" });
  }
});

module.exports = router;
