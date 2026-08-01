import Project from '../models/Project.js';
import Tender from '../models/Tender.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { uploadBuffer } from '../services/cloudinaryService.js';
import { compareBeforeAfter } from '../services/geminiImageCompareService.js';
import { updateContractorScore } from '../services/contractorScoreService.js';

// Helper to create notifications for all authority users
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

export const createProject = async (req, res, next) => {
  try {
    const { title, tenderId, lat, lng, address } = req.body;

    if (!title || !tenderId || !lat || !lng) {
      return res.status(400).json({ message: 'Title, tenderId, lat, and lng are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Project "before" image is required' });
    }

    // Find tender and its contractor
    const tender = await Tender.findById(tenderId);
    if (!tender) {
      return res.status(404).json({ message: 'Associated Tender not found' });
    }

    const contractorId = tender.contractor;

    // Upload "before" image
    const uploadResult = await uploadBuffer(req.file.buffer, 'projects/before');

    // Create project
    const project = await Project.create({
      title,
      tender: tenderId,
      contractor: contractorId,
      location: {
        lat: Number(lat),
        lng: Number(lng),
        address: address || ''
      },
      beforeImageUrl: uploadResult.secure_url,
      status: 'Pending'
    });

    const populatedProject = await project.populate(['tender', 'contractor']);
    res.status(201).json(populatedProject);
  } catch (error) {
    next(error);
  }
};

export const completeProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Project "after" image is required' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.beforeImageUrl) {
      return res.status(400).json({ message: 'Project does not have a "before" image yet' });
    }

    // Upload "after" image
    const uploadResult = await uploadBuffer(req.file.buffer, 'projects/after');
    project.afterImageUrl = uploadResult.secure_url;

    // Run Gemini Before/After Comparison
    const comparison = await compareBeforeAfter(project.beforeImageUrl, project.afterImageUrl);

    // Update completion and health metrics
    project.completionScore = comparison.completionScore;
    project.riskLevel = comparison.riskLevel;
    project.projectHealth = comparison.projectHealth;
    project.aiComparisonNotes = comparison.notes;

    // Set project status based on score
    if (comparison.completionScore >= 80) {
      project.status = 'Verified';
    } else {
      project.status = 'Flagged';
    }

    await project.save();

    // Trigger contractor score recalculation
    await updateContractorScore(project.contractor);

    // Notify authorities
    await notifyAuthorities(
      `Project "${project.title}" completed with a completion score of ${project.completionScore}% (${project.status}).`,
      project.status === 'Verified' ? 'success' : 'warning'
    );

    const populatedProject = await project.populate(['tender', 'contractor']);
    res.json(populatedProject);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find().populate(['tender', 'contractor']).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate(['tender', 'contractor']);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
};
