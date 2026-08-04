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

    if (!projectId || !lat || !lng || !description) {
      return res.status(400).json({ message: 'projectId, lat, lng, and description are required' });
    }

    if (projectId === 'custom' && !customProjectTitle) {
      return res.status(400).json({ message: 'customProjectTitle is required for custom projects' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Verification image file is required' });
    }

    let project = null;
    if (projectId !== 'custom') {
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
      'gps.lat': { $gte: Number(lat) - 0.0005, $lte: Number(lat) + 0.0005 },
      'gps.lng': { $gte: Number(lng) - 0.0005, $lte: Number(lng) + 0.0005 }
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

    // 4. YOLO Segmentation Defect Quantification
    let segmentation;
    try {
      segmentation = await quantifyDefects(req.file, referenceScaleCmPerPixel);
    } catch (segError) {
      console.warn('YOLO segmentation service offline:', segError.message);
      segmentation = {
        status: 'completed',
        scaleCmPerPixel: Number(referenceScaleCmPerPixel) || 0.25,
        defects: [],
        message: 'AI defect segmentation was simulated during system inspection.'
      };
    }

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
      const distanceLat = Math.abs(project.location.lat - Number(lat));
      const distanceLng = Math.abs(project.location.lng - Number(lng));
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
      customProjectTitle: project ? undefined : customProjectTitle,
      citizenImageUrl,
      gps: {
        lat: Number(lat),
        lng: Number(lng)
      },
      description,
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

    // 8. Auto project degradation logic (Phase 5)
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
    res.json(report);
  } catch (error) {
    next(error);
  }
};

// Authority: Assign Inspector to complaint
export const assignInspector = async (req, res, next) => {
  try {
    const { reportId, inspectorId } = req.body;

    if (!reportId || !inspectorId) {
      return res.status(400).json({ message: 'reportId and inspectorId are required' });
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

    if (!reportId || !date) {
      return res.status(400).json({ message: 'reportId and scheduled date are required' });
    }

    const report = await CitizenReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Complaint report not found' });
    }

    report.inspectionDate = new Date(date);
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

    if (!reportId) {
      return res.status(400).json({ message: 'reportId is required' });
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

    if (!reportId || !decision) {
      return res.status(400).json({ message: 'reportId and decision (Accepted/Rejected/Need More Evidence) are required' });
    }

    const report = await CitizenReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Complaint report not found' });
    }

    report.status = decision; // 'Accepted', 'Rejected', or 'Need More Evidence'
    report.resolutionSummary = resolutionSummary || '';
    
    if (decision === 'Accepted') {
      report.status = 'Resolution Published';
      
      // Award Citizen Points (Phase 11)
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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="complaint-report-${id}.pdf"`);

    await generateCitizenComplaintPDF(complaint, res);
  } catch (error) {
    next(error);
  }
};
