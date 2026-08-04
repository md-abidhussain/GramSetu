import express from 'express';
import { 
  createProject, 
  completeProject, 
  getProjects, 
  getProjectById, 
  getProjectLifecycle, 
  updateProjectLifecycle,
  downloadProjectReport
} from '../controllers/projectController.js';
import { protectAuthority, protectAny, restrictTo } from '../middleware/authMiddleware.js';
import { uploadImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Projects ledger listing and details (available to citizens and authorities)
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.get('/:id/lifecycle', getProjectLifecycle);
router.get('/:id/report', protectAny, downloadProjectReport);

// Authority-only endpoints: Create and update projects
router.post('/', protectAuthority, restrictTo('District Authority', 'PWD Engineer', 'Admin'), uploadImage, createProject);
router.patch('/:id/complete', protectAuthority, restrictTo('Inspector', 'Admin', 'PWD Engineer'), uploadImage, completeProject);
router.patch('/:id/lifecycle', protectAuthority, restrictTo('District Authority', 'Admin', 'Government Officer', 'PWD Engineer', 'Inspector'), updateProjectLifecycle);

export default router;
