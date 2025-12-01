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
  // Load service account
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  const bucketName = process.env.FIREBASE_BUCKET;

  if (!bucketName) {
    console.warn("⚠️ WARNING: FIREBASE_BUCKET missing in .env. Firebase Storage will be disabled.");
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName,
    });
    bucket = admin.storage().bucket();
  }
} catch (error) {
  console.error("❌ ERROR: Failed to initialize Firebase Admin SDK:", error.message);
}

export default bucket;
