const express = require("express");
const router = express.Router();
const { Admin, Manager, Staff } = require("../models/user");

// ✅ Fetch all users
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


// ✅ Add Admin
router.post("/admins", async (req, res) => {
  try {
    const { fullName, email, role, isVerified, lastLogin, phone } = req.body;
    const user = new Admin({ fullName, email, phone, role: "Admin", password: "default123", isVerified, lastLogin });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding admin:", err);
    res.status(500).json({ message: "Failed to add admin" });
  }
});

// ✅ Add Manager
router.post("/managers", async (req, res) => {
  try {
    const { fullName, email, role, isVerified, lastLogin, phone } = req.body;
    const user = new Manager({ fullName, email, phone, role: "Inventory Manager", password: "default123", isVerified, lastLogin });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding manager:", err);
    res.status(500).json({ message: "Failed to add manager" });
  }
});

// ✅ Add Staff
router.post("/staff", async (req, res) => {
  try {
    const { fullName, email, role, isVerified, lastLogin, phone } = req.body;
    const user = new Staff({ fullName, email, phone, role: "Staff", password: "default123", isVerified, lastLogin });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Error adding staff:", err);
    res.status(500).json({ message: "Failed to add staff" });
  }
});

// ✅ Update user (PUT)
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
    user.role = role;
    user.isVerified = isVerified ?? user.isVerified;
    user.lastLogin = lastLogin ?? user.lastLogin;

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

module.exports = router;
