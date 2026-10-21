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
import { protectAny, protectAuthority, restrictTo } from '../middleware/authMiddleware.js';
import { createCredentialLimiter } from '../middleware/rateLimits.js';
import { PERMISSIONS } from '../utils/roles.js';

const router = express.Router();

// Only the endpoints that check a password are rate limited. /me runs on every
// page load and used to share this limit, which locked people out for browsing.
const credentialLimiter = createCredentialLimiter();

// Official accounts are issued by an Admin, never self-registered.
router.post('/authority/register', protectAuthority, restrictTo(...PERMISSIONS.manageOfficials), registerAuthority);
router.post('/authority/login', credentialLimiter, loginAuthority);
router.post('/citizen/register', credentialLimiter, registerCitizen);
router.post('/citizen/login', credentialLimiter, loginCitizen);
router.get('/me', protectAny, me);
router.get('/inspectors', protectAuthority, getInspectors);
router.post('/logout', logout);

export default router;
