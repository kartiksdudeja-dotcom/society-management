import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import SyncState from "./models/SyncState.js";
import GmailToken from "./models/GmailToken.js";

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ENV from correct directory (only in development, Render uses env vars directly)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, ".env") });
}

const app = express();

// CORS - Allow both localhost and production domains
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://society-management-git-main-kartiksdudeja-dotcoms-projects.vercel.app",
      "https://society-management-hwk4ohbp8-kartiksdudeja-dotcoms-projects.vercel.app",
      "https://icontowersociety.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Gmail OAuth
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const CRED_PATH = path.join(__dirname, "credentials/google-oauth.json");
const TOKEN_PATH = path.join(__dirname, "tokens/gmail-token.json");

function loadCredentials() {
  const content = fs.readFileSync(CRED_PATH);
  return JSON.parse(content);
}

function createOAuthClient() {
  const creds = loadCredentials();
  const conf = creds.installed || creds.web;

  return new google.auth.OAuth2(
    conf.client_id,
    conf.client_secret,
    conf.redirect_uris[0]
  );
}

// OAuth URL
app.get("/auth/google", (req, res) => {
  try {
    const oAuth2Client = createOAuthClient();
    const url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    res.send({ url });
  } catch (err) {
    res.status(500).send("Error generating Google Auth URL");
  }
});

// OAuth callback
app.get("/oauth2callback", async (req, res) => {
  try {
    const oAuth2Client = createOAuthClient();
    const code = req.query.code;

    const { tokens } = await oAuth2Client.getToken(code);
    
    // ✅ SAVE TO MONGODB INSTEAD OF FILE
    await GmailToken.deleteMany({});
    await GmailToken.create(tokens);
    
    console.log("✅ Gmail token saved to MongoDB");

    res.send("Gmail connected successfully! Token saved to database.");
  } catch (err) {
    console.error("❌ OAuth callback error:", err);
    res.status(500).send("Failed to complete Google authentication.");
  }
});

// Routes (ES MODULE imports)
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import sinkingfundRoutes from "./routes/sinkingfundRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import cctvRoutes from "./routes/cctvRoutes.js";
import bankRoutes from "./routes/bankRoutes.js";
import unitRoutes from "./routes/unitRoutes.js";
import monthlyExpenseRoutes from "./routes/monthlyExpenseRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import adminTaskRoutes from "./routes/adminTaskRoutes.js";
import paymentVerificationRoutes from "./routes/paymentVerificationRoutes.js";
import interestRoutes from "./routes/interestRoutes.js";
import { readBankEmails } from "./services/gmailReader.js";

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/sinkingfund", sinkingfundRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/collection", collectionRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/cctv", cctvRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/unit", unitRoutes);
app.use("/api/monthly-expense", monthlyExpenseRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin-tasks", adminTaskRoutes);
app.use("/api/payment-verifications", paymentVerificationRoutes);
app.use("/api/interest", interestRoutes);


// Cron
import { initCronJobs, setSyncing } from "./cron/cronJobs.js";
initCronJobs();

// MongoDB Connection with Better Error Handling
const MONGO_URI = process.env.MONGO_URI;

// Debug: Log the source of config
console.log("📌 Environment:", process.env.NODE_ENV || "development");
console.log("📌 MONGO_URI Set:", MONGO_URI ? "YES" : "NO");
console.log("📌 MONGO_URI Length:", MONGO_URI?.length || 0);

if (MONGO_URI) {
  // Show only first 50 chars and last 20 chars of URI (for security)
  const start = MONGO_URI.substring(0, 50);
  const end = MONGO_URI.substring(MONGO_URI.length - 20);
  console.log(`📌 MONGO_URI: ${start}...${end}`);
}

if (!MONGO_URI) {
  console.error("❌ CRITICAL: MONGO_URI environment variable is NOT SET!");
  console.error("Please set MONGO_URI in your environment variables or .env file");
  process.exit(1);
}

console.log("📌 Connecting to MongoDB...");
console.log("📌 Database:", MONGO_URI.split('/').pop() || "(default: test)");

mongoose
  .connect(MONGO_URI, {
    maxPoolSize: 10,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: "majority",
  })
  .then(async () => {
    console.log("✅ MongoDB Connected successfully!");
    console.log(`📊 Connected to database: ${mongoose.connection.db.name}`);
    
    // Start initial sync after DB connected
    try {
      setSyncing(true);
      console.log("📩 Starting Email Sync...");
      await readBankEmails();
      console.log("📩 Email Sync Completed.");
    } catch (err) {
      console.error("❌ Initial sync error:", err.message);
    } finally {
      setSyncing(false);
    }
  })
  .catch((err) => {
    console.error("❌ MONGODB CONNECTION FAILED!");
    console.error("Error Message:", err.message);
    console.error("\n🔧 TROUBLESHOOTING CHECKLIST:");
    console.error("1. ✅ Is MONGO_URI set in environment variables?");
    console.error("2. ✅ Does MONGO_URI end with /test or /society-management?");
    console.error("3. ✅ Is 0.0.0.0/0 whitelisted in MongoDB Atlas Network Access?");
    console.error("4. ✅ Is the password correct in the connection string?");
    process.exit(1);
  });

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn("⚠️  MongoDB disconnected! Will attempt to reconnect...");
});

mongoose.connection.on('error', (err) => {
  console.error("⚠️  MongoDB connection error:", err.message);
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
