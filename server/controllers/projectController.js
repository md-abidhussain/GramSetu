import Project from '../models/Project.js';
import Tender from '../models/Tender.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { uploadBuffer } from '../services/cloudinaryService.js';
import { compareBeforeAfter } from '../services/geminiImageCompareService.js';
import { updateContractorScore } from '../services/contractorScoreService.js';
import { runMockLifecycleAI } from '../services/mockLifecycleAIService.js';

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

const transitionLifecycle = async (project, nextStatus, updatedBy = 'system', remarks = '') => {
  const allowedTransitions = {
    'Tender Published': ['Project Created'],
    'Project Created': ['Construction Started'],
    'Construction Started': ['Waiting for AI Verification'],
    'Waiting for AI Verification': ['AI Verified'],
    'AI Verified': ['Citizen Verification'],
    'Citizen Verification': ['Under Authority Review'],
    'Under Authority Review': ['Approved', 'Rejected', 'Maintenance Required'],
    'Approved': [],
    'Rejected': [],
    'Maintenance Required': []
  };

  if (!allowedTransitions[project.lifecycleStatus] || !allowedTransitions[project.lifecycleStatus].includes(nextStatus)) {
    throw new Error(`Invalid lifecycle transition from ${project.lifecycleStatus} to ${nextStatus}`);
  }

  project.lifecycleStatus = nextStatus;
  project.statusHistory.push({
    status: nextStatus,
    updatedBy,
    remarks
  });

  return project;
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
      status: 'Pending',
      lifecycleStatus: 'Project Created',
      statusHistory: [{
        status: 'Project Created',
        updatedBy: 'system',
        remarks: 'Project created from tender intake.'
      }]
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

    const lifecycleUpdated = await transitionLifecycle(project, 'Waiting for AI Verification', 'system', 'Completion image uploaded and ready for AI assessment.');
    lifecycleUpdated.status = comparison.completionScore >= 80 ? 'Verified' : 'Flagged';
    await lifecycleUpdated.save();

    // Trigger contractor score recalculation
    await updateContractorScore(project.contractor);

    // Notify authorities
    await notifyAuthorities(
      `Project "${project.title}" entered AI verification with a completion score of ${project.completionScore}% (${project.status}).`,
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

export const getProjectLifecycle = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      currentStatus: project.lifecycleStatus,
      history: project.statusHistory.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectLifecycle = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (project.lifecycleStatus === 'Approved' || project.lifecycleStatus === 'Rejected' || project.lifecycleStatus === 'Maintenance Required') {
      return res.status(400).json({ message: 'Project lifecycle is already complete' });
    }

    const updatedProject = await transitionLifecycle(project, status, req.user?.name || 'authority', remarks || '');

    if (status === 'Waiting for AI Verification' && (!project.completionScore || !project.afterImageUrl)) {
      return res.status(400).json({ message: 'Project requires completion data before AI verification' });
    }

    if (status === 'Waiting for AI Verification') {
      const aiResult = await runMockLifecycleAI(project);
      updatedProject.completionScore = aiResult.completionScore;
      updatedProject.riskLevel = aiResult.riskLevel;
      updatedProject.aiComparisonNotes = aiResult.recommendation;
      updatedProject.status = aiResult.completionScore >= 80 ? 'Verified' : 'Flagged';
      updatedProject.lifecycleStatus = 'AI Verified';
      updatedProject.statusHistory.push({
        status: 'AI Verified',
        updatedBy: req.user?.name || 'system',
        remarks: aiResult.recommendation
      });
    }

    if (status === 'Approved') {
      updatedProject.status = 'Verified';
    }

    if (status === 'Rejected' || status === 'Maintenance Required') {
      updatedProject.status = 'Flagged';
    }

    await updatedProject.save();

    await notifyAuthorities(`Project "${updatedProject.title}" moved to ${updatedProject.lifecycleStatus}.`, 'info');

    const populatedProject = await updatedProject.populate(['tender', 'contractor']);
    res.json(populatedProject);
  } catch (error) {
    next(error);
  }
};
