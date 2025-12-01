import mongoose from 'mongoose';

const CCTVRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  remark: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  approvalDate: {
    type: Date,
  },
  viewStartTime: {
    type: Date,
  },
  viewEndTime: {
    type: Date,
  },
});

export default mongoose.model('CCTVRequest', CCTVRequestSchema);
