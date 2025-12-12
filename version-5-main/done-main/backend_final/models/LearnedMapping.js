import mongoose from "mongoose";

const LearnedMappingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      // The extracted name from bank email (lowercase for matching)
    },
    
    officeNumber: {
      type: String,
      // Office/Shop number like "208", "301", "410"
    },
    
    officeType: {
      type: String,
      enum: ["office", "shop", "flat", "other"],
      default: "office",
    },
    
    ownerName: {
      type: String,
      // Actual owner name of the office/shop
    },
    
    payerName: {
      type: String,
      // Name of person who paid (could be relative/wife/husband etc)
    },
    
    relationship: {
      type: String,
      // Relationship to owner: "self", "wife", "husband", "son", "daughter", "relative", "employee"
      default: "self",
    },
    
    examples: {
      type: [String],
      // Example names from bank transactions
      default: [],
    },
    
    confidence: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

LearnedMappingSchema.index({ key: 1 });

export default mongoose.model("LearnedMapping", LearnedMappingSchema, "learnedmappings");
