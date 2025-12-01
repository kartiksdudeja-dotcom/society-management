import mongoose from "mongoose";

const ProcessedEmailSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    from: String,
    subject: String,
    date: Date,
  },
  { timestamps: true }
);

export default mongoose.model("ProcessedEmail", ProcessedEmailSchema);
