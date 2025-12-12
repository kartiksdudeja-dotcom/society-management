import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 60000 });

async function verify() {
  try {
    await client.connect();
    const db = client.db("society-management");
    const token = await db.collection("gmailtokens").findOne({});
    
    console.log("📋 Current token in MongoDB:");
    if (token) {
      console.log({
        _id: token._id,
        access_token: token.access_token ? `✅ Present (${token.access_token.substring(0, 20)}...)` : "❌ Missing",
        refresh_token: token.refresh_token ? `✅ Present (${token.refresh_token.substring(0, 20)}...)` : "❌ MISSING",
        scope: token.scope,
        expiry_date: token.expiry_date
      });
    } else {
      console.log("❌ No token found in database!");
    }
  } finally {
    await client.close();
  }
}

verify();
