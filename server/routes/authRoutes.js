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

// Official accounts are created by an administrator, not by whoever visits
// the site. This endpoint used to be open and accepted any role in the body,
// including Admin, so a stranger could make themselves an administrator of a
// government portal. Officials sign in with an account issued to them.
router.post('/authority/register', protectAuthority, restrictTo('Admin'), registerAuthority);
router.post('/authority/login', loginAuthority);
router.post('/citizen/register', registerCitizen);
router.post('/citizen/login', loginCitizen);
router.get('/me', protectAny, me);
router.get('/inspectors', protectAuthority, getInspectors);
router.post('/logout', logout);

export default router;
