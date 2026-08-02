import express from 'express';
import { 
  createTender, 
  getTenders, 
  getTenderById, 
  getTendersByContractor 
} from '../controllers/tenderController.js';
import { protectAuthority, restrictTo } from '../middleware/authMiddleware.js';
import { uploadTender } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All tender endpoints are strictly restricted to authority accounts
router.use(protectAuthority);
router.use(restrictTo('District Authority', 'PWD Engineer', 'Admin', 'Government Officer', 'Inspector'));

router.post('/', uploadTender, createTender);
router.get('/', getTenders);
router.get('/:id', getTenderById);
router.get('/contractor/:contractorId', getTendersByContractor);

export default router;
