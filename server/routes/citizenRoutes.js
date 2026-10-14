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
import { protectAuthority, protectCitizen, protectAny, restrictTo } from '../middleware/authMiddleware.js';
import { uploadImage, verifyImageContents } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Any authenticated user: Get details of a single report
router.get('/:id/report', validateIdParam(), protectAny, downloadCitizenReport);

// Citizen-only: File a complaint
router.post('/', protectCitizen, uploadImage, verifyImageContents, createCitizenReport);

// Any authenticated user: Get details of a single report
router.get('/:id', validateIdParam(), protectAny, getCitizenReportById);

// Any authenticated user: Get list of reports (filtered automatically by role)
router.get('/', protectAny, getCitizenReports);

// Authorities: Assign inspector to complaint
router.post('/assign-inspector', protectAuthority, restrictTo('District Authority', 'Admin', 'Government Officer'), assignInspector);

// Inspector: Schedule inspection
router.post('/schedule-inspection', protectAuthority, restrictTo('Inspector', 'Admin'), scheduleInspection);

// Inspector: Upload inspection evidence
router.post('/upload-verification', protectAuthority, restrictTo('Inspector', 'Admin'), uploadImage, verifyImageContents, uploadInspectionVerification);

// Authority: Accept / Reject / Need More Evidence
router.post('/resolve', protectAuthority, restrictTo('District Authority', 'Admin', 'Government Officer'), resolveComplaint);

export default router;
