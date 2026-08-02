import CitizenReport from '../models/CitizenReport.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { uploadBuffer } from '../services/cloudinaryService.js';
import { detectDamageAndDiscrepancies, detectDamageSingleImage } from '../services/geminiDamageDetectionService.js';
import { quantifyDefects } from '../services/segmentationService.js';
import { updateContractorScore } from '../services/contractorScoreService.js';

// Helper to notify authority users
const notifyAuthorities = async (message, type = 'info') => {
  try {
    const authorities = await User.find({ role: { $in: ['authority', 'admin'] } });
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

export const createCitizenReport = async (req, res, next) => {
  try {
    const { projectId, lat, lng, description, referenceScaleCmPerPixel, customProjectTitle } = req.body;

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

    // 2. Perform AI Analysis
    let aiAnalysis;
    if (project) {
      // Determine target photo to compare against
      const targetImageUrl = project.afterImageUrl || project.beforeImageUrl;
      if (!targetImageUrl) {
        return res.status(400).json({ message: 'Project does not have any completion or progress images to verify against' });
      }
      aiAnalysis = await detectDamageAndDiscrepancies(citizenImageUrl, targetImageUrl);
    } else {
      // Custom project: analyze damage on the single image
      aiAnalysis = await detectDamageSingleImage(citizenImageUrl);
    }
    
    let segmentation;
    try {
      segmentation = await quantifyDefects(req.file, referenceScaleCmPerPixel);
    } catch (segError) {
      console.warn('YOLO segmentation service is offline or failed:', segError.message);
      // Fallback object so submission succeeds without the Python server running
      segmentation = {
        status: 'completed',
        scaleCmPerPixel: Number(referenceScaleCmPerPixel) || 0.25,
        defects: [],
        message: 'AI defect segmentation service was offline during submission.'
      };
    }

    const segmentedIssueTypes = (segmentation.defects || [])
      .map(({ type }) => type)
      .filter(type => ['crack', 'pothole', 'road_damage', 'leakage', 'broken_infrastructure', 'garbage'].includes(type));
    const detectedIssues = [...new Set([...(aiAnalysis.detectedIssues || []), ...segmentedIssueTypes])];

    // 3. Create Citizen Report
    const report = await CitizenReport.create({
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
      referenceScaleCmPerPixel: Number(referenceScaleCmPerPixel) || undefined,
      segmentation,
      status: 'New'
    });

    // 4. Update project status and notify authorities if discrepancy flagged
    if (project) {
      if (report.flaggedAsDiscrepancy) {
        project.status = 'Flagged';
        await project.save();

        // Recalculate contractor performance score
        await updateContractorScore(project.contractor);

        // Create notification
        await notifyAuthorities(
          `ALERT: Discrepancy flagged by citizen at "${project.title}". Match Score: ${report.matchScore}%. Issues: ${report.detectedIssues.join(', ')}`,
          'danger'
        );
      } else {
        // Create info notification
        await notifyAuthorities(
          `New citizen report submitted for "${project.title}". Match Score: ${report.matchScore}%.`,
          'info'
        );
      }
    } else {
      // Custom project notification
      await notifyAuthorities(
        `New citizen report submitted for custom project "${customProjectTitle}". Issues: ${report.detectedIssues.join(', ')}`,
        'info'
      );
    }

    const populatedReport = project ? await report.populate('project') : report;
    res.status(201).json(populatedReport);
  } catch (error) {
    next(error);
  }
};

export const getCitizenReports = async (req, res, next) => {
  try {
    const reports = await CitizenReport.find().populate({
      path: 'project',
      populate: { path: 'contractor' }
    }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

export const getCitizenReportById = async (req, res, next) => {
  try {
    const report = await CitizenReport.findById(req.params.id).populate('project');
    if (!report) {
      return res.status(404).json({ message: 'Citizen report not found' });
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const updateCitizenReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const report = await CitizenReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Citizen report not found' });
    }

    report.status = status;
    await report.save();

    res.json(report);
  } catch (error) {
    next(error);
  }
};
