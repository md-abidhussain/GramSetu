import express from 'express';
import { 
  registerAuthority, 
  loginAuthority, 
  registerCitizen, 
  loginCitizen, 
  me, 
  logout,
  getInspectors
} from '../controllers/authController.js';
import { protectAny, protectAuthority } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/authority/register', registerAuthority);
router.post('/authority/login', loginAuthority);
router.post('/citizen/register', registerCitizen);
router.post('/citizen/login', loginCitizen);
router.get('/me', protectAny, me);
router.get('/inspectors', protectAuthority, getInspectors);
router.post('/logout', logout);

export default router;
