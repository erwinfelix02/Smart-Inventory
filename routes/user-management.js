const express = require("express");
const router = express.Router();
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
    const { fullName, email, role, isVerified, lastLogin } = req.body;
    const user = new Admin({
      fullName,
      email,
      role: "Admin",
      password: "default123", // temporary placeholder
      isVerified,
      lastLogin
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding admin:", err);
    res.status(500).json({ message: "Failed to add admin" });
  }
});

router.post("/managers", async (req, res) => {
  try {
    const { fullName, email, role, isVerified, lastLogin } = req.body;
    const user = new Manager({
      fullName,
      email,
      role: "Inventory Manager",
      password: "default123",
      isVerified,
      lastLogin
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding manager:", err);
    res.status(500).json({ message: "Failed to add manager" });
  }
});

router.post("/staff", async (req, res) => {
  try {
    const { fullName, email, role, isVerified, lastLogin } = req.body;
    const user = new Staff({
      fullName,
      email,
      role: "Staff",
      password: "default123",
      isVerified,
      lastLogin
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding staff:", err);
    res.status(500).json({ message: "Failed to add staff" });
  }
});

module.exports = router;
