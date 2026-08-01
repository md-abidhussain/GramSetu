import express from 'express';
import { getNotifications, markNotificationRead } from '../controllers/dashboardController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('authority', 'admin'));

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);

export default router;
