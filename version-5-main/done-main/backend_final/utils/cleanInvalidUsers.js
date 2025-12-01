import User from "../models/User.js";

function isValidFlat(flat) {
  flat = flat.toString().toUpperCase();

  // SHOP 1–9
  if (flat.startsWith("SHOP")) {
    const num = parseInt(flat.replace("SHOP", "").trim());
    return num >= 1 && num <= 9;
  }

  // Remove A-, B-, etc for safety
  const cleaned = flat.replace(/[A-Z]-?/g, "");
  const n = parseInt(cleaned);

  // Offices on 1st to 4th floor
  if (
    (n >= 101 && n <= 111) ||
    (n >= 201 && n <= 211) ||
    (n >= 301 && n <= 311) ||
    (n >= 401 && n <= 411)
  ) {
    return true;
  }

  return false;
}

async function cleanInvalidUsers() {
  console.log("🔥 Checking for invalid users...");

  const users = await User.find({ role: "member" });

  for (const user of users) {
    if (!isValidFlat(user.flatNumber)) {
      console.log(`❌ Deleting invalid user: ${user.name} (${user.flatNumber})`);
      await User.findByIdAndDelete(user._id);
    }
  }

  console.log("✅ Cleanup complete.");
}

export default cleanInvalidUsers;
