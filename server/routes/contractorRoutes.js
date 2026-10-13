import express from 'express';
import { validateIdParam } from '../middleware/validateIdParam.js';
import { createContractor, getContractorAnalysis, getContractors } from '../controllers/contractorController.js';
import { protectAuthority } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only logged in authority officials can view and manage contractors
router.use(protectAuthority);

router.get('/', getContractors);
router.post('/', createContractor);
router.get('/:id/analysis', validateIdParam(), getContractorAnalysis);

export default router;
