import express from 'express';
import { validateIdParam } from '../middleware/validateIdParam.js';
import {
  createCitizenReport,
  getCitizenReports,
  getCitizenReportById,
  assignInspector,
  scheduleInspection,
  uploadInspectionVerification,
  resolveComplaint,
  downloadCitizenReport
} from '../controllers/citizenController.js';
import { optionalSession, protectAuthority, protectCitizen, protectAny, restrictTo } from '../middleware/authMiddleware.js';
import { uploadImage, verifyImageContents } from '../middleware/uploadMiddleware.js';
import { PERMISSIONS } from '../utils/roles.js';

const router = express.Router();

// Citizens see only their own complaints (enforced in the controller); officials see all.
router.get('/', protectAny, getCitizenReports);
router.get('/:id', validateIdParam(), protectAny, getCitizenReportById);
router.get('/:id/report', validateIdParam(), optionalSession, downloadCitizenReport);

// Authentication runs before multer, so an anonymous caller is refused
// before any file is read into memory.
router.post('/', protectCitizen, uploadImage, verifyImageContents, createCitizenReport);

router.post('/assign-inspector', protectAuthority, restrictTo(...PERMISSIONS.assignInspector), assignInspector);
router.post('/schedule-inspection', protectAuthority, restrictTo(...PERMISSIONS.inspect), scheduleInspection);
router.post('/upload-verification', protectAuthority, restrictTo(...PERMISSIONS.inspect), uploadImage, verifyImageContents, uploadInspectionVerification);
router.post('/resolve', protectAuthority, restrictTo(...PERMISSIONS.resolveComplaint), resolveComplaint);

export default router;
