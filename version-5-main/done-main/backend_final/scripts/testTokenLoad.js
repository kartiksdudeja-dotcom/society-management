import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import GmailToken from "../models/GmailToken.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

async function testLoad() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB via Mongoose");

    const token = await GmailToken.findOne();
    
    console.log("\n📋 Token loaded by Mongoose:");
    console.log("Token object:", token);
    console.log("\nToken fields:");
    console.log({
      _id: token?._id || "❌ Missing",
      access_token: token?.access_token ? `✅ Present` : "❌ Missing",
      refresh_token: token?.refresh_token ? `✅ Present` : "❌ Missing",
      scope: token?.scope || "❌ Missing",
      token_type: token?.token_type || "❌ Missing",
      expiry_date: token?.expiry_date || "❌ Missing"
    });

    if (!token) {
      console.log("❌ NO TOKEN FOUND!");
    } else if (!token.refresh_token) {
      console.log("❌ refresh_token is missing or null/undefined!");
    } else {
      console.log("✅ Token is complete and ready for use");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

testLoad();
