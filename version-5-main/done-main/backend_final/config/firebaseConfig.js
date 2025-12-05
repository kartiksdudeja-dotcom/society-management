import admin from "firebase-admin";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "../service-account.json");

// Load service account
let bucket = null; // Initialize bucket to null

try {
  let serviceAccount;
  
  // Try environment variable first (for Render deployment)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("🔑 Loading Firebase credentials from environment variable...");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (fs.existsSync(serviceAccountPath)) {
    // Fallback to file (for local development)
    console.log("🔑 Loading Firebase credentials from service-account.json...");
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  } else {
    throw new Error("No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT env var or provide service-account.json");
  }

  const bucketName = process.env.FIREBASE_BUCKET;

  if (!bucketName) {
    console.warn("⚠️ WARNING: FIREBASE_BUCKET missing in .env. Firebase Storage will be disabled.");
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName,
    });
    bucket = admin.storage().bucket();
    console.log("✅ Firebase Storage initialized successfully!");
  }
} catch (error) {
  console.error("❌ ERROR: Failed to initialize Firebase Admin SDK:", error.message);
}

export default bucket;
