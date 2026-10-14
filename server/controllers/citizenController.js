import CitizenReport from '../models/CitizenReport.js';
import Project from '../models/Project.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';
import Reward from '../models/Reward.js';
import Contractor from '../models/Contractor.js';
import Notification from '../models/Notification.js';
import { uploadBuffer } from '../services/cloudinaryService.js';
import { detectDamageAndDiscrepancies, detectDamageSingleImage } from '../services/geminiDamageDetectionService.js';
import { quantifyDefects } from '../services/segmentationService.js';
import { updateContractorScore } from '../services/contractorScoreService.js';
import { generateCitizenComplaintPDF } from '../services/pdfReportService.js';
import { isValidId, toLatitude, toLongitude, toText } from '../utils/validators.js';
import { canViewReport, isAllowedDecision } from '../utils/access.js';

// Helper to notify authority users
const notifyAuthorities = async (message, type = 'info') => {
  try {
    const authorities = await Authority.find({ role: { $in: ['Government Officer', 'Inspector', 'District Authority', 'PWD Engineer', 'Admin'] } });
    const notifications = authorities.map(auth => ({
      user: auth._id,
      message,
      type,
      read: false
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};

// Complete automated complaint submission workflow
export const createCitizenReport = async (req, res, next) => {
  try {
    const { projectId, lat, lng, description, referenceScaleCmPerPixel, customProjectTitle } = req.body;
    const citizenId = req.user?._id; // Loaded via protectCitizen middleware

    // lat and lng are not tested for truthiness here: 0 is a real coordinate on
    // both axes, so a complaint on the equator would have been refused.
    // toLatitude and toLongitude below decide what counts as valid.
    if (!projectId || !description) {
      return res.status(400).json({ message: 'A project and a description are required' });
    }

    const latitude = toLatitude(lat);
    const longitude = toLongitude(lng);
    if (latitude === null || longitude === null) {
      return res.status(400).json({ message: 'Please give a valid location on the map' });
    }

    const reportText = toText(description, 2000);
    if (!reportText) {
      return res.status(400).json({ message: 'Describe the problem in 2000 characters or fewer' });
    }

    const isCustomProject = projectId === 'custom';
    let customTitle = null;
    if (isCustomProject) {
      customTitle = toText(customProjectTitle, 200);
      if (!customTitle) {
        return res.status(400).json({ message: 'Give the place a name of 200 characters or fewer' });
      }
    } else if (!isValidId(projectId)) {
      return res.status(400).json({ message: 'That project does not exist' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A photo of the problem is required' });
    }

    let project = null;
    if (!isCustomProject) {
      project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
    }

    // 1. Upload citizen image to Cloudinary
    const uploadResult = await uploadBuffer(req.file.buffer, 'citizen_reports');
    const citizenImageUrl = uploadResult.secure_url;

    // 2. Automated Duplicate Detection
    // Check if there is another report in a ~50m radius (0.0005 lat/lng difference) with similar status
    const duplicateReport = await CitizenReport.findOne({
      status: { $ne: 'Resolved' },
      'gps.lat': { $gte: latitude - 0.0005, $lte: latitude + 0.0005 },
      'gps.lng': { $gte: longitude - 0.0005, $lte: longitude + 0.0005 }
    });

    const duplicateFound = !!duplicateReport;

    // 3. AI Damage Detection
    let aiAnalysis;
    if (project) {
      const targetImageUrl = project.afterImageUrl || project.beforeImageUrl;
      if (!targetImageUrl) {
        return res.status(400).json({ message: 'Project does not have any baseline photos' });
      }
      aiAnalysis = await detectDamageAndDiscrepancies(citizenImageUrl, targetImageUrl);
    } else {
      aiAnalysis = await detectDamageSingleImage(citizenImageUrl);
    }

    // 4. Measure the defects in the photo, if that service is running.
    // It reports its own status, so a missing measurement is recorded as
    // missing instead of being filled in with made-up numbers.
    const segmentation = await quantifyDefects(req.file, referenceScaleCmPerPixel);

    const segmentedIssueTypes = (segmentation.defects || [])
      .map(({ type }) => type)
      .filter(type => ['crack', 'pothole', 'road_damage', 'leakage', 'broken_infrastructure', 'garbage'].includes(type));
    const detectedIssues = [...new Set([...(aiAnalysis.detectedIssues || []), ...segmentedIssueTypes])];

    // 5. Automated Severity Assessment
    let severity = 'Low';
    const totalAreaCm2 = (segmentation.defects || []).reduce((acc, curr) => acc + (curr.areaCm2 || 0), 0);
    if (totalAreaCm2 > 500 || detectedIssues.length >= 3) {
      severity = 'High';
    } else if (totalAreaCm2 > 100 || detectedIssues.length >= 1) {
      severity = 'Medium';
    }

    // 6. Geo-Verification check (within 150m of project location if project specified)
    let geoVerified = true;
    if (project) {
      const distanceLat = Math.abs(project.location.lat - latitude);
      const distanceLng = Math.abs(project.location.lng - longitude);
      if (distanceLat > 0.0015 || distanceLng > 0.0015) {
        geoVerified = false;
      }
    }

    // Determine final initial status
    let finalStatus = 'Authority Notification';
    if (duplicateFound) {
      finalStatus = 'Duplicate Detected';
    }

    // 7. Save Report
    const report = await CitizenReport.create({
      citizen: citizenId || null,
      project: project ? project._id : undefined,
      customProjectTitle: project ? undefined : customTitle,
      citizenImageUrl,
      gps: {
        lat: latitude,
        lng: longitude
      },
      description: reportText,
      detectedIssues,
      aiReport: aiAnalysis.aiReport,
      matchScore: aiAnalysis.matchScore,
      flaggedAsDiscrepancy: aiAnalysis.flaggedAsDiscrepancy || false,
      referenceScaleCmPerPixel: Number(referenceScaleCmPerPixel) || 0.25,
      segmentation,
      severity,
      duplicateFound,
      status: finalStatus
    });

    // 8. Auto project degradation logic
    if (project && !duplicateFound) {
      project.complaintCount = (project.complaintCount || 0) + 1;
      
      if (project.complaintCount >= 3) {
        project.projectHealth = 'Failed';
        project.healthPercentage = Math.max(15, project.healthPercentage - 30);
        project.suggestedMaintenance = true;
        project.status = 'Flagged';
        project.lifecycleStatus = 'Maintenance Required';
      } else {
        project.projectHealth = 'At Risk';
        project.healthPercentage = Math.max(55, project.healthPercentage - 15);
        project.status = 'Flagged';
        project.lifecycleStatus = 'Under Authority Review';
      }
      await project.save();

      // Reduce Contractor trust score
      if (project.contractor) {
        const contractor = await Contractor.findById(project.contractor);
        if (contractor) {
          contractor.citizenComplaintsCount = (contractor.citizenComplaintsCount || 0) + 1;
          contractor.trustScore = Math.max(15, contractor.trustScore - 10);
          await contractor.save();
        }
      }
    }

    // Trigger Notifications
    const logPrefix = duplicateFound ? '[DUPLICATE]' : '[NEW]';
    await notifyAuthorities(
      `${logPrefix} Citizen complaint submitted at ${project ? `"${project.title}"` : `custom project "${customProjectTitle}"`}. Severity: ${severity}. Geo-Verified: ${geoVerified}`,
      severity === 'High' ? 'danger' : 'warning'
    );

    const populatedReport = project ? await report.populate('project') : report;
    res.status(201).json(populatedReport);
  } catch (error) {
    next(error);
  }
};

// Get all reports (with citizen isolation)
export const getCitizenReports = async (req, res, next) => {
  try {
    let filter = {};
    // If the logged-in user is a citizen, isolate retrieval to their own submissions only
    if (req.isCitizen) {
      filter = { citizen: req.user._id };
    }
    
    const reports = await CitizenReport.find(filter)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name role uniqueUserId')
      .populate({
        path: 'project',
        populate: { path: 'contractor' }
      })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

// Get report by ID
export const getCitizenReportById = async (req, res, next) => {
  try {
    const report = await CitizenReport.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name role uniqueUserId')
      .populate({
        path: 'project',
        populate: { path: 'contractor' }
      });

    if (!report) {
      return res.status(404).json({ message: 'Citizen report not found' });
    }

    if (!canViewReport(req, report)) {
      return res.status(403).json({ message: 'You can only view your own complaints' });
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
};

// Authority: Assign Inspector to complaint
export const assignInspector = async (req, res, next) => {
  try {
    const { reportId, inspectorId } = req.body;

    if (!isValidId(reportId) || !isValidId(inspectorId)) {
      return res.status(400).json({ message: 'A complaint and an inspector must both be chosen' });
    }

    const report = await CitizenReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Complaint report not found' });
    }

    const inspector = await Authority.findById(inspectorId);
    if (!inspector || inspector.role !== 'Inspector') {
      return res.status(400).json({ message: 'Selected official is not a registered Inspector' });
    }

    report.assignedOfficer = inspector._id;
    report.status = 'Inspector Assigned';
    report.resolutionEta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days default SLA
    await report.save();

    await notifyAuthorities(`Inspector ${inspector.name} assigned to Complaint #${report._id.toString().slice(-6)}`, 'info');

    res.json(report);
  } catch (error) {
    next(error);
  }
};

// Inspector: Schedule Inspection Date
export const scheduleInspection = async (req, res, next) => {
  try {
    const { reportId, date } = req.body;

    if (!isValidId(reportId)) {
      return res.status(400).json({ message: 'That complaint does not exist' });
    }

    const scheduledFor = new Date(date);
    if (isNaN(scheduledFor.getTime())) {
      return res.status(400).json({ message: 'Please choose a valid inspection date' });
    }

    const report = await CitizenReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Complaint report not found' });
    }

    report.inspectionDate = scheduledFor;
    report.status = 'Inspection Scheduled';
    await report.save();

    res.json(report);
  } catch (error) {
    next(error);
  }
};

// Inspector: Upload Inspection Verification Photo and Notes
export const uploadInspectionVerification = async (req, res, next) => {
  try {
    const { reportId, inspectorNotes } = req.body;

    if (!isValidId(reportId)) {
      return res.status(400).json({ message: 'That complaint does not exist' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Inspector verification image is required' });
    }

    const report = await CitizenReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Complaint report not found' });
    }

    // Upload inspector inspection photo to Cloudinary
    const uploadResult = await uploadBuffer(req.file.buffer, 'inspection_evidence');
    
    report.inspectorBeforeImageUrl = report.citizenImageUrl; // Before is the citizen's photo
    report.inspectorAfterImageUrl = uploadResult.secure_url; // After is the inspector's proof
    report.inspectorNotes = inspectorNotes || 'No notes provided by inspector.';
    report.status = 'Inspector Uploads Verification';
    await report.save();

    // Trigger Gemini analysis of the inspector's image compare
    // Automatically transition stages to simulate processing
    report.status = 'Gemini Analysis';
    await report.save();

    report.status = 'AI Agent Validation';
    await report.save();

    res.json(report);
  } catch (error) {
    next(error);
  }
};

// Authority Decision: Accept, Reject, or Need More Evidence
export const resolveComplaint = async (req, res, next) => {
  try {
    const { reportId, decision, resolutionSummary } = req.body;

    if (!isValidId(reportId)) {
      return res.status(400).json({ message: 'That complaint does not exist' });
    }

    // The status field accepts every stage of the complaint lifecycle, so
    // without this an official could post any stage here and jump a complaint
    // straight to published, skipping inspection.
    if (!isAllowedDecision(decision)) {
      return res.status(400).json({ message: 'Decision must be Accepted, Rejected, or Need More Evidence' });
    }

    const report = await CitizenReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Complaint report not found' });
    }

    report.status = decision; // 'Accepted', 'Rejected', or 'Need More Evidence'
    report.resolutionSummary = resolutionSummary || '';
    
    if (decision === 'Accepted') {
      report.status = 'Resolution Published';
      
      // Award Citizen Points
      if (report.citizen) {
        const citizen = await Citizen.findById(report.citizen);
        if (citizen) {
          citizen.points = (citizen.points || 0) + 150; // 150 Civic Points
          citizen.volunteerScore = (citizen.volunteerScore || 0) + 10;
          
          // Badge generation logic
          if (citizen.points >= 300 && !citizen.badges.includes('Civic Leader')) {
            citizen.badges.push('Civic Leader');
          } else if (citizen.points >= 150 && !citizen.badges.includes('Verified Contributor')) {
            citizen.badges.push('Verified Contributor');
          }
          await citizen.save();

          // Create Reward entry
          await Reward.create({
            citizen: citizen._id,
            rewardType: 'Citizen Points',
            amount: 150,
            title: 'Verified Complaint Bounty',
            description: `Granted 150 Civic points for identifying defects at ${report.customProjectTitle || 'Project Location'}.`
          });
        }
      }
    }

    await report.save();
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const downloadCitizenReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await CitizenReport.findById(id)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name role uniqueUserId')
      .populate({
        path: 'project',
        populate: { path: 'contractor' }
      });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint report not found' });
    }

    if (!canViewReport(req, complaint)) {
      return res.status(403).json({ message: 'You can only download your own complaints' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="complaint-report-${id}.pdf"`);

    await generateCitizenComplaintPDF(complaint, res);
  } catch (error) {
    next(error);
  }
};
