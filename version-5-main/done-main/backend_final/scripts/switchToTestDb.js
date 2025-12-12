import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI.replace('/test', ''); // Get base URI

const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 60000 });

async function copyToken() {
  try {
    await client.connect();
    
    // Get token from society-management database
    const sourceDb = client.db("society-management");
    const sourceToken = await sourceDb.collection("gmailtokens").findOne({});
    
    if (!sourceToken) {
      console.log("❌ No token found in society-management database!");
      process.exit(1);
    }

    console.log("📋 Source token from society-management:");
    console.log({
      _id: sourceToken._id,
      refresh_token: sourceToken.refresh_token ? "✅ Present" : "❌ Missing"
    });

    // Delete old token in test database
    const targetDb = client.db("test");
    const deleteResult = await targetDb.collection("gmailtokens").deleteMany({});
    console.log(`\n🗑️ Deleted ${deleteResult.deletedCount} old token(s) from test database`);

    // Copy token to test database
    const insertResult = await targetDb.collection("gmailtokens").insertOne({
      access_token: sourceToken.access_token,
      refresh_token: sourceToken.refresh_token,
      scope: sourceToken.scope,
      token_type: sourceToken.token_type,
      expiry_date: sourceToken.expiry_date,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("✅ Token copied to test database with ID:", insertResult.insertedId);

    // Verify
    const verify = await targetDb.collection("gmailtokens").findOne({});
    console.log("\n✅ Verification - Token in test database:");
    console.log({
      _id: verify._id,
      access_token: verify.access_token ? "✅ Present" : "❌ Missing",
      refresh_token: verify.refresh_token ? "✅ Present" : "❌ Missing",
      scope: verify.scope
    });

    console.log("\n✅ Setup complete! Using test database now.");
  } finally {
    await client.close();
  }
}

copyToken();
