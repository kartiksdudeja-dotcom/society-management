import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { getUserProfile, updateUserProfile, loginAsMember } from "../controllers/authController.js";

const router = express.Router();

// ---------------- REGISTER ----------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, flatNumber, role } = req.body;

    if (!name || !email || !password || !flatNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // check existing email
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // save new user
    const user = new User({
      name,
      email,
      password: hashed,
      FlatNumber: flatNumber,
      role: role === "admin" ? "admin" : "user"   // safe admin assignment
    });

    await user.save();

    res.json({ message: "User registered successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Registration failed" });
  }
});


// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Incorrect password" });

    // token with role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        FlatNumber: user.FlatNumber,
        role: user.role
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Login failed" });
  }
});


// ---------------- MAKE ADMIN ----------------
router.put("/make-admin/:email", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { role: "admin" },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Admin access granted", user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------- USER PROFILE ROUTES ----------------
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// ---------------- ADMIN/MANAGER LOGIN AS MEMBER ----------------
router.post("/login-as-member", protect, authorize(["admin", "manager"]), loginAsMember);

export default router;
