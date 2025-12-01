import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    unit: { type: String, required: true },      // Flat / Shop / Office number
    owner: { type: String, required: true },     // Name of owner
    type: { type: String, default: "other" },    // Optional property type

    months: { type: Object, required: true },    // Apr-Dec values
    pending: { type: Object, required: true },   // Pending per month
    extra: { type: String, default: "" },        // Notes / Extra info
  },
  { timestamps: true }
);

export default mongoose.model("Maintenance", maintenanceSchema);
