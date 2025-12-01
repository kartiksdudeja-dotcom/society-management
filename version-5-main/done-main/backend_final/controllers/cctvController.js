import CCTVRequest from '../models/CCTVRequest.js';
import User from '../models/User.js';

// @desc    Request CCTV access
// @route   POST /api/cctv/request
// @access  Private
export const requestCCTVAccess = async (req, res) => {
  try {
    const { remark } = req.body;
    const userId = req.user.id; 

    const cctvRequest = await CCTVRequest.create({
      userId,
      remark,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: cctvRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all CCTV requests (Admin only)
// @route   GET /api/cctv/admin/all
// @access  Private/Admin
export const getAllCCTVRequests = async (req, res) => {
  try {
    const requests = await CCTVRequest.find().populate('userId', 'name flatNumber');
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Approve CCTV request (Admin only)
// @route   PUT /api/cctv/admin/approve/:id
// @access  Private/Admin
export const approveCCTVRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const cctvRequest = await CCTVRequest.findById(id);

    if (!cctvRequest) {
      return res.status(404).json({ success: false, error: 'CCTV Request not found' });
    }

    cctvRequest.status = 'approved';
    cctvRequest.approvalDate = Date.now();
    await cctvRequest.save();

    res.status(200).json({ success: true, data: cctvRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Reject CCTV request (Admin only)
// @route   PUT /api/cctv/admin/reject/:id
// @access  Private/Admin
export const rejectCCTVRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const cctvRequest = await CCTVRequest.findById(id);

    if (!cctvRequest) {
      return res.status(404).json({ success: false, error: 'CCTV Request not found' });
    }

    cctvRequest.status = 'rejected';
    await cctvRequest.save();

    res.status(200).json({ success: true, data: cctvRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get user's CCTV requests
// @route   GET /api/cctv/my-requests
// @access  Private
export const getUserCCTVRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await CCTVRequest.find({ userId }).sort({ requestDate: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Start CCTV view session
// @route   POST /api/cctv/view/start/:id
// @access  Private
export const startCCTVViewSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const cctvRequest = await CCTVRequest.findById(id);

    if (!cctvRequest) {
      return res.status(404).json({ success: false, error: 'CCTV Request not found' });
    }

    if (cctvRequest.userId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to start this session' });
    }

    if (cctvRequest.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'CCTV Request not approved' });
    }

    // Check if a session is already active or expired
    if (cctvRequest.viewStartTime && cctvRequest.viewEndTime && cctvRequest.viewEndTime > Date.now()) {
      return res.status(400).json({ success: false, error: 'CCTV session already active for this request' });
    }

    if (cctvRequest.viewEndTime && cctvRequest.viewEndTime <= Date.now()) {
      // Session has expired, update status to expired
      cctvRequest.status = 'expired';
      await cctvRequest.save();
      return res.status(400).json({ success: false, error: 'CCTV session has expired, please submit a new request' });
    }

    const viewStartTime = Date.now();
    const viewEndTime = new Date(viewStartTime + 20 * 60 * 1000); // 20 minutes from now

    cctvRequest.viewStartTime = viewStartTime;
    cctvRequest.viewEndTime = viewEndTime;
    await cctvRequest.save();

    // In a real application, you would integrate with Hikvision here
    // For example, generating a temporary viewing URL or credentials
    // For now, we'll just return the session details.

    res.status(200).json({
      success: true,
      message: 'CCTV viewing session started for 20 minutes',
      viewStartTime,
      viewEndTime,
      // In a real scenario, this would be a Hikvision specific URL
      cctvStreamUrl: 'https://example.com/hikvision/stream?token=YOUR_TEMP_TOKEN' 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
