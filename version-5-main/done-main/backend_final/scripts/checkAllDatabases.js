import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 60000 });

async function checkAllDatabases() {
  try {
    await client.connect();
    const admin = client.db().admin();
    
    console.log("🔍 Listing all databases...\n");
    const { databases } = await admin.listDatabases();
    
    for (const db of databases) {
      console.log(`📦 Database: ${db.name}`);
      
      const database = client.db(db.name);
      const collections = await database.listCollections().toArray();
      
      for (const col of collections) {
        if (col.name.includes("token") || col.name.includes("gmail")) {
          const count = await database.collection(col.name).countDocuments();
          console.log(`   └─ Collection: ${col.name} (${count} docs)`);
          
          const docs = await database.collection(col.name).find({}).toArray();
          for (const doc of docs) {
            console.log(`      - ID: ${doc._id}, refresh_token: ${doc.refresh_token ? '✅' : '❌'}`);
          }
        }
      }
    }
  } finally {
    await client.close();
  }
}

checkAllDatabases();
