import express from 'express';
import { validateIdParam } from '../middleware/validateIdParam.js';
import {
  createProject,
  completeProject,
  getProjects,
  getProjectById,
  getProjectLifecycle,
  updateProjectLifecycle,
  retryAiVerification,
  downloadProjectReport
} from '../controllers/projectController.js';
import { optionalSession, protectAuthority, restrictTo } from '../middleware/authMiddleware.js';
import { uploadImage, verifyImageContents } from '../middleware/uploadMiddleware.js';
import { PERMISSIONS } from '../utils/roles.js';

const router = express.Router();

// Public: anyone may see the basic facts of a public works project. Officials
// (detected from an optional session) see tender and contractor details too.
router.get('/', optionalSession, getProjects);
router.get('/:id', validateIdParam(), optionalSession, getProjectById);
router.get('/:id/lifecycle', validateIdParam(), optionalSession, getProjectLifecycle);

router.get('/:id/report', validateIdParam(), protectAuthority, downloadProjectReport);
router.post('/', protectAuthority, restrictTo(...PERMISSIONS.createProject), uploadImage, verifyImageContents, createProject);
router.patch('/:id/complete', validateIdParam(), protectAuthority, restrictTo(...PERMISSIONS.completeProject), uploadImage, verifyImageContents, completeProject);
router.post('/:id/ai-verification', validateIdParam(), protectAuthority, restrictTo(...PERMISSIONS.completeProject), retryAiVerification);
router.patch('/:id/lifecycle', validateIdParam(), protectAuthority, restrictTo(...PERMISSIONS.advanceProject), updateProjectLifecycle);

export default router;
