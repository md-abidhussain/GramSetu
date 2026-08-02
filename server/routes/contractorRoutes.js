import express from 'express';
import { createContractor, getContractorAnalysis, getContractors } from '../controllers/contractorController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('authority', 'admin'));

router.get('/', getContractors);
router.post('/', createContractor);
router.get('/:id/analysis', getContractorAnalysis);

export default router;
