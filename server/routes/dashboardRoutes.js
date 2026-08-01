import express from 'express';
import { 
  getSummary, 
  getRiskAnalytics, 
  getContractorScores, 
  getComplaints, 
  getMapData 
} from '../controllers/dashboardController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('authority', 'admin'));

router.get('/summary', getSummary);
router.get('/risk-analytics', getRiskAnalytics);
router.get('/contractor-scores', getContractorScores);
router.get('/complaints', getComplaints);
router.get('/map-data', getMapData);

export default router;
