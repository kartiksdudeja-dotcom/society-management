import mongoose from "mongoose";

const InterestSchema = new mongoose.Schema({
  flat: {
    type: String,
    required: true,
    index: true
  },
  ownerName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  monthYear: {
    type: String,
    required: true,
    index: true
  },
  transactionId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: "Extra payment - Interest"
  }
}, {
  timestamps: true
});

export default mongoose.model("Interest", InterestSchema);
