import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  houseNumber: { type: String, required: true },
  type: { type: String, required: true }, // Rent Agreement / Police Verification / Other
  driveLink: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Document", documentSchema);
