import Project from '../models/Project.js';
import Tender from '../models/Tender.js';
import Contractor from '../models/Contractor.js';
import CitizenReport from '../models/CitizenReport.js';
import Notification from '../models/Notification.js';

export const getSummary = async (req, res, next) => {
  try {
    const totalProjects = await Project.countDocuments();
    const completedProjects = await Project.countDocuments({ afterImageUrl: { $exists: true, $ne: null } });
    
    // Average completion score (exclude projects where score is null/undefined)
    const projectsWithScore = await Project.find({ completionScore: { $ne: null, $exists: true } });
    const avgScore = projectsWithScore.length > 0
      ? Math.round(projectsWithScore.reduce((sum, p) => sum + (p.completionScore || 0), 0) / projectsWithScore.length)
      : 100;

    const flaggedProjects = await Project.countDocuments({ status: 'Flagged' });
    const totalComplaints = await CitizenReport.countDocuments();
    const activeTendersCount = await Tender.countDocuments();

    res.json({
      totalProjects,
      completedProjects,
      averageCompletionScore: avgScore,
      flaggedProjects,
      totalComplaints,
      activeTendersCount
    });
  } catch (error) {
    next(error);
  }
};

export const getRiskAnalytics = async (req, res, next) => {
  try {
    const projectRisk = await Project.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);
    const tenderRisk = await Tender.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    // Format risk response
    const formatRisk = (riskGroup) => {
      const risks = { Low: 0, Medium: 0, High: 0 };
      riskGroup.forEach(g => {
        if (g._id && risks[g._id] !== undefined) {
          risks[g._id] = g.count;
        }
      });
      return risks;
    };

    res.json({
      projects: formatRisk(projectRisk),
      tenders: formatRisk(tenderRisk)
    });
  } catch (error) {
    next(error);
  }
};

export const getContractorScores = async (req, res, next) => {
  try {
    const contractors = await Contractor.find().sort({ trustScore: -1 });
    res.json(contractors);
  } catch (error) {
    next(error);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    const complaints = await CitizenReport.find()
      .populate('project')
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name role')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    next(error);
  }
};

export const getMapData = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('contractor', 'name trustScore')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// Notification methods
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure it belongs to the user
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    next(error);
  }
};
