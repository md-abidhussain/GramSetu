import express from 'express';
import { 
  createCitizenReport, 
  getCitizenReports, 
  getCitizenReportById, 
  updateCitizenReportStatus 
} from '../controllers/citizenController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { uploadImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Publicly accessible for citizen report submissions
router.post('/', uploadImage, createCitizenReport);

// Protected routes (authorities/admins only)
router.use(protect);
router.use(restrictTo('authority', 'admin'));

router.get('/', getCitizenReports);
router.get('/:id', getCitizenReportById);
router.patch('/:id/status', updateCitizenReportStatus);

export default router;
