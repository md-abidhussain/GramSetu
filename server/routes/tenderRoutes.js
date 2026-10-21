import express from 'express';
import { validateIdParam } from '../middleware/validateIdParam.js';
import { createTender, getTenders, getTenderById, getTendersByContractor } from '../controllers/tenderController.js';
import { protectAuthority, restrictTo } from '../middleware/authMiddleware.js';
import { uploadTender, verifyPdfContents } from '../middleware/uploadMiddleware.js';
import { PERMISSIONS } from '../utils/roles.js';

const router = express.Router();

// Tenders are for officials only.
router.use(protectAuthority);

router.get('/', restrictTo(...PERMISSIONS.viewTenders), getTenders);
router.get('/contractor/:contractorId', validateIdParam('contractorId'), restrictTo(...PERMISSIONS.viewTenders), getTendersByContractor);
router.get('/:id', validateIdParam(), restrictTo(...PERMISSIONS.viewTenders), getTenderById);
router.post('/', restrictTo(...PERMISSIONS.manageTenders), uploadTender, verifyPdfContents, createTender);

export default router;
