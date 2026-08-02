import express from 'express';
import { getMyRewards } from '../controllers/rewardController.js';
import { protectCitizen } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-rewards', protectCitizen, getMyRewards);

export default router;
