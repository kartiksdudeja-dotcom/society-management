import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend_final directory
const envPath = path.join(__dirname, "../.env");
console.log("📖 Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Error loading .env:", result.error);
  process.exit(1);
}

console.log("✅ .env loaded successfully");
console.log("📌 MONGO_URI:", process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + "..." : "NOT SET");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "society-management";
const COLLECTION_NAME = "gmailtokens";

async function updateToken() {
  const client = new MongoClient(MONGO_URI, { 
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    retryWrites: true
  });

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Read the token from file
    const tokenPath = path.join(__dirname, "../tokens/gmail-token.json");
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    
    console.log("\n📖 Token from file:");
    console.log({
      access_token: tokenData.access_token ? "✅ Present (length: " + tokenData.access_token.length + ")" : "❌ Missing",
      refresh_token: tokenData.refresh_token ? "✅ Present (length: " + tokenData.refresh_token.length + ")" : "❌ Missing",
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      expiry_date: tokenData.expiry_date
    });

    // Delete old tokens
    const deleteResult = await collection.deleteMany({});
    console.log(`\n🗑️ Deleted ${deleteResult.deletedCount} old token(s)`);

    // Insert new token
    const insertResult = await collection.insertOne({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      expiry_date: tokenData.expiry_date,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("✅ New token inserted with ID:", insertResult.insertedId);

    // Verify the token was saved
    const saved = await collection.findOne({ _id: insertResult.insertedId });
    console.log("\n✅ Verified token in MongoDB:");
    console.log({
      _id: saved._id,
      access_token: saved.access_token ? "✅ Present" : "❌ Missing",
      refresh_token: saved.refresh_token ? "✅ Present" : "❌ Missing",
      scope: saved.scope,
      token_type: saved.token_type,
      expiry_date: saved.expiry_date
    });

    console.log("\n✅ Token update complete! Gmail sync should now work.");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

updateToken();
