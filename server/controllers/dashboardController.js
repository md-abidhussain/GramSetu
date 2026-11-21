import Project from '../models/Project.js';
import Tender from '../models/Tender.js';
import Contractor from '../models/Contractor.js';
import CitizenReport from '../models/CitizenReport.js';
import Notification from '../models/Notification.js';
import { readPagination, setPaginationHeaders } from '../utils/pagination.js';

export const getSummary = async (req, res, next) => {
  try {
    const [totalProjects, completedProjects, scoreStats, flaggedProjects, totalComplaints, activeTendersCount, aiPendingProjects] =
      await Promise.all([
        Project.estimatedDocumentCount(),
        Project.countDocuments({ afterImageUrl: { $exists: true, $nin: [null, ''] } }),
        // Averaged in the database over scored civil projects
        Project.aggregate([
          { $match: { completionScore: { $type: 'number', $gt: 0 } } },
          { $group: { _id: null, average: { $avg: '$completionScore' }, count: { $sum: 1 } } }
        ]),
        Project.countDocuments({ $or: [{ status: 'Flagged' }, { riskLevel: 'High' }] }),
        CitizenReport.estimatedDocumentCount(),
        Tender.estimatedDocumentCount(),
        Project.countDocuments({ lifecycleStatus: 'Waiting for AI Verification' })
      ]);

    res.json({
      totalProjects,
      completedProjects,
      // null (shown as "no data yet") instead of a made-up 100 when nothing has been assessed.
      averageCompletionScore: scoreStats[0] ? Math.round(scoreStats[0].average) : null,
      aiAssessedProjects: scoreStats[0]?.count ?? 0,
      aiPendingProjects,
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
    const group = [{ $match: { riskLevel: { $in: ['Low', 'Medium', 'High'] } } }, { $group: { _id: '$riskLevel', count: { $sum: 1 } } }];
    const [projectRisk, tenderRisk] = await Promise.all([Project.aggregate(group), Tender.aggregate(group)]);

    const format = (rows) => rows.reduce((risks, row) => ({ ...risks, [row._id]: row.count }), { Low: 0, Medium: 0, High: 0 });
    res.json({ projects: format(projectRisk), tenders: format(tenderRisk) });
  } catch (error) {
    next(error);
  }
};

export const getContractorScores = async (req, res, next) => {
  try {
    const contractors = await Contractor.find()
      .select('name registrationId trustScore performanceScore citizenComplaintsCount delayedCount completedOnTime dataSource')
      .sort({ trustScore: -1 })
      .limit(100);
    res.json(contractors);
  } catch (error) {
    next(error);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    const pagination = readPagination(req.query);
    const [complaints, total] = await Promise.all([
      CitizenReport.find()
        .populate('project', 'title location status')
        .populate('citizen', 'name email phone')
        .populate('assignedOfficer', 'name role')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      CitizenReport.estimatedDocumentCount()
    ]);
    setPaginationHeaders(res, pagination, total);
    res.json(complaints);
  } catch (error) {
    next(error);
  }
};

export const getMapData = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .select('title location status lifecycleStatus projectHealth healthPercentage completionScore riskLevel contractor')
      .populate('contractor', 'name trustScore')
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    // Ownership is part of the query, so another user's id simply matches nothing.
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json(notification);
  } catch (error) {
    next(error);
  }
};
