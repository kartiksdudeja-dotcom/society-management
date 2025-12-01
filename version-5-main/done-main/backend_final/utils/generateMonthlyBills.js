import User from "../models/User.js";
import Maintenance from "../models/Maintenance.js";

// Determine office or shop
function detectPropertyType(flatNumber) {
  flatNumber = flatNumber.toString().toUpperCase();

  // If it starts with SHOP
  if (flatNumber.startsWith("SHOP")) return "shop";

  // Remove A-, B-, C-, etc.
  const cleaned = flatNumber.replace(/[A-Z]-?/g, "");

  const n = parseInt(cleaned);

  if (
    (n >= 101 && n <= 111) ||
    (n >= 201 && n <= 211) ||
    (n >= 301 && n <= 311) ||
    (n >= 401 && n <= 411)
  ) {
    return "office";
  }

  return null;
}

async function generateMonthlyBills() {
  console.log("🔥 Checking monthly maintenance bills...");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // ⚠️ Your system uses role = "user", not "member"
  const users = await User.find({ role: "user" });

  for (const user of users) {
    const flat = user.FlatNumber;
    const propertyType = detectPropertyType(flat);

    if (!propertyType) {
      console.log("⚠️ Unknown propertyType for", flat);
      continue;
    }

    // ⚠️ Your schema does NOT support this search (month, year)
    const exists = await Maintenance.findOne({
      userId: user._id,
      month: currentMonth,
      year: currentYear,
    });

    if (exists) {
      console.log(`✔ Bill already exists for ${flat}`);
      continue;
    }

    const amountDue = propertyType === "office" ? 2000 : 1500;

    // ⚠️ Your schema does NOT support these fields
    await Maintenance.create({
      userId: user._id,
      flatNumber: flat,
      propertyType,
      month: currentMonth,
      year: currentYear,
      amountDue,
      amountPaid: 0,
      status: "pending",
    });

    console.log(`🔥 Created maintenance bill for ${flat} (${propertyType})`);
  }

  console.log("✅ Monthly bill generation completed.");
}

export default generateMonthlyBills;
