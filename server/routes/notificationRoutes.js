import express from 'express';
import { getNotifications, markNotificationRead } from '../controllers/dashboardController.js';
import { protectAny } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectAny);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);

export default router;
