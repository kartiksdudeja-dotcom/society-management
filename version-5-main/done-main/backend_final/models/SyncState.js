import mongoose from "mongoose";

const syncSchema = new mongoose.Schema({
  lastHistoryId: { type: String }
});

export default mongoose.model("SyncState", syncSchema);
