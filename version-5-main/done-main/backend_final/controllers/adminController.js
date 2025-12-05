import User from "../models/User.js";
import Maintenance from "../models/Maintenance.js";
import SinkingFund from "../models/SinkingFund.js";
import Expense from "../models/Expense.js";
import bcrypt from "bcryptjs";


// ✅ GET ALL MEMBERS
export const getMembers = async (req, res) => {
  try {
    // Fetch all users except password
    const members = await User.find().select("-password");
    res.json(members);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching members",
      error: err.message,
    });
  }
};


// ✅ CREATE NEW USER
export const createUser = async (req, res) => {
  try {
    const { name, email, password, FlatNumber, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      FlatNumber: FlatNumber || "",
      role: role || "user"
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ message: "User created successfully", user: userResponse });

  } catch (err) {
    res.status(500).json({
      message: "Error creating user",
      error: err.message,
    });
  }
};


// ✅ UPDATE USER PASSWORD
export const updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    res.status(500).json({
      message: "Error updating password",
      error: err.message,
    });
  }
};


// ✅ UPDATE USER (FULLY FIXED)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // frontend sends: flatNumber (lowercase n)
    // database uses: FlatNumber (capital F)
    const { name, flatNumber, email, role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,

        // THIS IS THE IMPORTANT FIX
        FlatNumber: flatNumber,  

        role,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user });

  } catch (err) {
    res.status(500).json({ 
      message: "Error updating user", 
      error: err.message 
    });
  }
};


// ✅ DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting user",
      error: err.message,
    });
  }
};


// ✅ ADMIN SUMMARY
export const getAdminSummary = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ role: "user" });
    const totalMaintenance = await Maintenance.countDocuments();
    const totalSinkingFund = await SinkingFund.countDocuments();
    const totalExpense = await Expense.countDocuments();

    const maintenancePaid = await Maintenance.countDocuments({ status: "paid" });
    const maintenancePending = await Maintenance.countDocuments({ status: "pending" });

    res.json({
      totalMembers,
      totalMaintenance,
      totalSinkingFund,
      totalExpense,
      maintenancePaid,
      maintenancePending,
    });

  } catch (err) {
    res.status(500).json({
      message: "Error fetching summary",
      error: err.message,
    });
  }
};
