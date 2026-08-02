import express from 'express';
import { createProject, completeProject, getProjects, getProjectById, getProjectLifecycle, updateProjectLifecycle } from '../controllers/projectController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { uploadImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes (so citizens can fetch projects to select them in complaints)
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.get('/:id/lifecycle', getProjectLifecycle);

// Protected routes (authority/admin only)
router.post('/', protect, restrictTo('authority', 'admin'), uploadImage, createProject);
router.patch('/:id/complete', protect, restrictTo('authority', 'admin'), uploadImage, completeProject);
router.patch('/:id/lifecycle', protect, restrictTo('authority', 'admin'), updateProjectLifecycle);

export default router;
