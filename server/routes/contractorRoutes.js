import express from 'express';
import { validateIdParam } from '../middleware/validateIdParam.js';
import { createContractor, getContractorAnalysis, getContractors } from '../controllers/contractorController.js';
import { protectAuthority, restrictTo } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/roles.js';

const router = express.Router();

router.use(protectAuthority);

router.get('/', getContractors);
router.post('/', restrictTo(...PERMISSIONS.manageContractors), createContractor);
router.get('/:id/analysis', validateIdParam(), getContractorAnalysis);

export default router;
