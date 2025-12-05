import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { 
  requestCCTVAccess, 
  getAllCCTVRequests, 
  approveCCTVRequest, 
  rejectCCTVRequest, 
  getUserCCTVRequests,
  startCCTVViewSession
} from '../controllers/cctvController.js';

const router = express.Router();

// User can request CCTV access
router.post('/request', protect, requestCCTVAccess);

// User can view their own CCTV requests
router.get('/my-requests', protect, getUserCCTVRequests);

// Admin/Manager can get all CCTV requests
router.get('/admin/all', protect, authorize(['admin', 'manager']), getAllCCTVRequests);

// Admin/Manager can approve a CCTV request
router.put('/admin/approve/:id', protect, authorize(['admin', 'manager']), approveCCTVRequest);

// Admin/Manager can reject a CCTV request
router.put('/admin/reject/:id', protect, authorize(['admin', 'manager']), rejectCCTVRequest);

// Start CCTV view session (after approval)
router.post('/view/start/:id', protect, startCCTVViewSession); 

export default router;
