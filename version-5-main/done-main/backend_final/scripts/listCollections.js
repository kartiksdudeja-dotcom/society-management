import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

async function listCollections() {
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 60000 });
  
  try {
    await client.connect();
    const db = client.db("society-management");
    
    console.log("🔍 Collections in 'society-management' database:\n");
    const collections = await db.listCollections().toArray();
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`📦 ${col.name} (${count} document${count !== 1 ? 's' : ''})`);
      
      if (col.name.includes("token") || col.name.includes("gmail")) {
        const sample = await db.collection(col.name).findOne({});
        if (sample) {
          console.log(`   └─ Sample ID: ${sample._id}, has refresh_token: ${sample.refresh_token ? '✅' : '❌'}`);
        }
      }
    }
  } finally {
    await client.close();
  }
}

listCollections();
