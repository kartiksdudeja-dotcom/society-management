import User from "../models/User.js";
import Maintenance from "../models/Maintenance.js";
import SinkingFund from "../models/SinkingFund.js";
import Expense from "../models/Expense.js";


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
