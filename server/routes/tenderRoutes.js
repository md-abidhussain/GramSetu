import express from 'express';
import { createTender, getTenders, getTenderById, getTendersByContractor } from '../controllers/tenderController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { uploadTender } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All tender routes require login and authority/admin role
router.use(protect);
router.use(restrictTo('authority', 'admin'));

router.post('/', uploadTender, createTender);
router.get('/', getTenders);
router.get('/:id', getTenderById);
router.get('/contractor/:contractorId', getTendersByContractor);

export default router;
