import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 60000 });

async function cleanup() {
  try {
    await client.connect();
    const db = client.db("society-management");
    const collection = db.collection("gmailtokens");

    console.log("🔍 Finding all tokens in database...");
    const allTokens = await collection.find({}).toArray();
    
    console.log(`📋 Found ${allTokens.length} token(s):\n`);
    allTokens.forEach((token, idx) => {
      console.log(`Token ${idx + 1} (ID: ${token._id})`);
      console.log(`  - refresh_token: ${token.refresh_token ? '✅ Present' : '❌ MISSING'}`);
      console.log(`  - access_token: ${token.access_token ? '✅ Present (length: ' + token.access_token.length + ')' : '❌ Missing'}`);
      console.log(`  - expiry_date: ${token.expiry_date}`);
      console.log();
    });

    // Find token with refresh_token
    const goodToken = allTokens.find(t => t.refresh_token);
    if (!goodToken) {
      console.log("❌ No token with refresh_token found!");
      process.exit(1);
    }

    console.log(`✅ Found good token with ID: ${goodToken._id}`);
    console.log(`\n🗑️ Deleting all OTHER tokens...`);

    // Delete all except the good one
    const deleteResult = await collection.deleteMany({ _id: { $ne: goodToken._id } });
    console.log(`✅ Deleted ${deleteResult.deletedCount} old/bad token(s)`);

    // Verify only one token remains
    const remaining = await collection.countDocuments({});
    console.log(`\n✅ Now have ${remaining} token(s) in database`);

    const finalToken = await collection.findOne({});
    console.log("\n✅ Final token in database:");
    console.log({
      _id: finalToken._id,
      access_token: finalToken.access_token ? "✅ Present" : "❌ Missing",
      refresh_token: finalToken.refresh_token ? "✅ Present" : "❌ Missing",
      scope: finalToken.scope,
      token_type: finalToken.token_type,
      expiry_date: finalToken.expiry_date
    });

    console.log("\n✅ Cleanup complete! Email sync should now work.");
  } finally {
    await client.close();
  }
}

cleanup();
