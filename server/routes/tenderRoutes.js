import express from 'express';
import { validateIdParam } from '../middleware/validateIdParam.js';
import { 
  createTender, 
  getTenders, 
  getTenderById, 
  getTendersByContractor 
} from '../controllers/tenderController.js';
import { protectAuthority, restrictTo } from '../middleware/authMiddleware.js';
import { uploadTender, verifyPdfContents } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All tender endpoints are strictly restricted to authority accounts
router.use(protectAuthority);
router.use(restrictTo('District Authority', 'PWD Engineer', 'Admin', 'Government Officer', 'Inspector'));

router.post('/', uploadTender, verifyPdfContents, createTender);
router.get('/', getTenders);
router.get('/:id', validateIdParam(), getTenderById);
router.get('/contractor/:contractorId', validateIdParam('contractorId'), getTendersByContractor);

export default router;
