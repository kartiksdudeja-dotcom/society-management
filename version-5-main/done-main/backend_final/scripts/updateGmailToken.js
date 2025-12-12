import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import GmailToken from "../models/GmailToken.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/society-management";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB Connected");
}).catch((err) => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

async function updateToken() {
  try {
    // Read the token from file
    const tokenPath = path.join(__dirname, "../tokens/gmail-token.json");
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    
    console.log("📖 Token from file:", {
      access_token: tokenData.access_token ? "✅ Present" : "❌ Missing",
      refresh_token: tokenData.refresh_token ? "✅ Present" : "❌ Missing",
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      expiry_date: tokenData.expiry_date
    });

    // Delete old token and save new one
    await GmailToken.deleteMany({});
    const saved = await GmailToken.create({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      expiry_date: tokenData.expiry_date
    });

    console.log("✅ Gmail token updated in MongoDB:");
    console.log({
      _id: saved._id,
      access_token: saved.access_token ? "✅ Present" : "❌ Missing",
      refresh_token: saved.refresh_token ? "✅ Present" : "❌ Missing",
      scope: saved.scope,
      token_type: saved.token_type,
      expiry_date: saved.expiry_date
    });

    console.log("\n✅ Token update complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating token:", err.message);
    process.exit(1);
  }
}

updateToken();
