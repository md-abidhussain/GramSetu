import express from 'express';
import { createProject, completeProject, getProjects, getProjectById } from '../controllers/projectController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { uploadImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes (so citizens can fetch projects to select them in complaints)
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Protected routes (authority/admin only)
router.post('/', protect, restrictTo('authority', 'admin'), uploadImage, createProject);
router.patch('/:id/complete', protect, restrictTo('authority', 'admin'), uploadImage, completeProject);

export default router;
