import mongoose from "mongoose";

const sinkingFundSchema = new mongoose.Schema({
  unit: String,
  owner: String,
  paid: String,
  pending: Number
});

export default mongoose.model("SinkingFund", sinkingFundSchema);
