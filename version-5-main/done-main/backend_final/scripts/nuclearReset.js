import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 60000 });

async function nuclearReset() {
  try {
    await client.connect();
    const db = client.db("society-management");
    const collection = db.collection("gmailtokens");

    console.log("🔥 NUCLEAR RESET: Deleting ALL tokens...");
    const deleteResult = await collection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} token(s)`);

    // Read fresh token from file
    const tokenPath = path.join(__dirname, "../tokens/gmail-token.json");
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    
    console.log("\n📖 Token from file:");
    console.log({
      access_token_length: tokenData.access_token?.length,
      refresh_token_present: !!tokenData.refresh_token,
      refresh_token_length: tokenData.refresh_token?.length,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      expiry_date: tokenData.expiry_date
    });

    // Create single clean token
    const inserted = await collection.insertOne({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      expiry_date: tokenData.expiry_date
    });

    console.log(`\n✅ Inserted token with ID: ${inserted.insertedId}`);

    // Verify
    const allTokens = await collection.find({}).toArray();
    console.log(`\n✅ Total tokens in DB: ${allTokens.length}`);
    
    for (const t of allTokens) {
      console.log(`\n  Token ID: ${t._id}`);
      console.log(`  - access_token: ${t.access_token ? '✅ Length ' + t.access_token.length : '❌'}`);
      console.log(`  - refresh_token: ${t.refresh_token ? '✅ Length ' + t.refresh_token.length : '❌'}`);
      console.log(`  - scope: ${t.scope}`);
    }

    console.log("\n✅ Nuclear reset complete! Ready to test.");
  } finally {
    await client.close();
  }
}

nuclearReset();
