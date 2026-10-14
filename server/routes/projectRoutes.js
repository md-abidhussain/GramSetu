import express from 'express';
import { validateIdParam } from '../middleware/validateIdParam.js';
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
import { uploadImage, verifyImageContents } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Projects ledger listing and details (available to citizens and authorities)
router.get('/', getProjects);
router.get('/:id', validateIdParam(), getProjectById);
router.get('/:id/lifecycle', validateIdParam(), getProjectLifecycle);
router.get('/:id/report', validateIdParam(), protectAny, downloadProjectReport);

// Authority-only endpoints: Create and update projects
router.post('/', protectAuthority, restrictTo('District Authority', 'PWD Engineer', 'Admin'), uploadImage, verifyImageContents, createProject);
router.patch('/:id/complete', validateIdParam(), protectAuthority, restrictTo('Inspector', 'Admin', 'PWD Engineer'), uploadImage, verifyImageContents, completeProject);
router.patch('/:id/lifecycle', validateIdParam(), protectAuthority, restrictTo('District Authority', 'Admin', 'Government Officer', 'PWD Engineer', 'Inspector'), updateProjectLifecycle);

export default router;
