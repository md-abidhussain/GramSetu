import express from 'express';
import { 
  getSummary, 
  getRiskAnalytics, 
  getContractorScores, 
  getComplaints, 
  getMapData 
} from '../controllers/dashboardController.js';
import { protectAuthority, restrictTo } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/roles.js';

const router = express.Router();

router.use(protectAuthority);
router.use(restrictTo(...PERMISSIONS.viewDashboard));

router.get('/summary', getSummary);
router.get('/risk-analytics', getRiskAnalytics);
router.get('/contractor-scores', getContractorScores);
router.get('/complaints', getComplaints);
router.get('/map-data', getMapData);

export default router;
