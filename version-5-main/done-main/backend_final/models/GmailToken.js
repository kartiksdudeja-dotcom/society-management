import mongoose from "mongoose";

const GmailTokenSchema = new mongoose.Schema({
  access_token: String,
  refresh_token: String,
  scope: String,
  token_type: String,
  expiry_date: Number,
}, {
  timestamps: true // Adds createdAt and updatedAt
});

export default mongoose.model("GmailToken", GmailTokenSchema);
