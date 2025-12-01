import mongoose from "mongoose";

const UnitMappingSchema = new mongoose.Schema(
  {
    unitId: {
      type: String,
      required: true,
      unique: true,
      // Format: "office-102" or "shop-3"
      // Examples: "office-102", "shop-5", "apartment-701"
    },
    
    unitType: {
      type: String,
      enum: ["office", "shop", "apartment", "flat", "other"],
      default: "office",
    },
    
    unitNumber: {
      type: String,
      // e.g., "102", "5", "701"
    },
    
    ownerNames: {
      type: [String],
      // Aliases for the owner/payer
      // Examples: ["KAILASH MANGARAM DHANWANI", "kailash dhanwani", "kailash m dhanwani"]
      default: [],
    },
    
    vpaAliases: {
      type: [String],
      // UPI IDs or VPAs associated with this unit owner
      // Examples: ["kailashdhanwani880@okaxis", "gpay123@ybl"]
      default: [],
    },
    
    phoneNumbers: {
      type: [String],
      // Optional: phone numbers for this owner (for validation)
      default: [],
    },
    
    email: String,
    // Contact email for this owner
    
    notes: String,
    // Admin notes about this mapping
    // E.g., "Owner of office 102, pays maintenance from multiple VPAs"
    
    mappingConfidence: {
      type: String,
      enum: ["auto", "manual", "fuzzy", "pending"],
      default: "pending",
      // auto: Exact match on name or VPA
      // manual: Admin manually assigned
      // fuzzy: Fuzzy match (Levenshtein distance)
      // pending: Waiting for manual assignment
    },
    
    lastMappedAt: Date,
    // When this mapping was last verified/updated
    
    transactionCount: {
      type: Number,
      default: 0,
    },
    // How many transactions are mapped to this unit
    
    monthlyTotal: {
      credit: { type: Number, default: 0 },
      debit: { type: Number, default: 0 },
    },
    // Last month's totals (cached)
    
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Indexes
UnitMappingSchema.index({ unitId: 1 });
UnitMappingSchema.index({ ownerNames: 1 });
UnitMappingSchema.index({ vpaAliases: 1 });
UnitMappingSchema.index({ mappingConfidence: 1 });
UnitMappingSchema.index({ status: 1 });

export default mongoose.model("UnitMapping", UnitMappingSchema);
