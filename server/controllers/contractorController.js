import Contractor from '../models/Contractor.js';
import Project from '../models/Project.js';
import CitizenReport from '../models/CitizenReport.js';
import { toText, toNumberInRange } from '../utils/validators.js';
import { isValidEmail } from '../utils/credentials.js';
import { computeContractorScores } from '../services/contractorScoreService.js';
import { COMPLAINT_STATUS } from '../utils/complaintWorkflow.js';
import { readPagination, setPaginationHeaders } from '../utils/pagination.js';

export const getContractors = async (req, res, next) => {
  try {
    const pagination = readPagination(req.query);
    const [contractors, total] = await Promise.all([
      Contractor.find().sort({ trustScore: -1, name: 1 }).skip(pagination.skip).limit(pagination.limit),
      Contractor.estimatedDocumentCount()
    ]);
    setPaginationHeaders(res, pagination, total);
    res.json(contractors);
  } catch (error) {
    next(error);
  }
};

export const createContractor = async (req, res, next) => {
  try {
    const name = toText(req.body.name, 200);
    const registrationId = toText(req.body.registrationId, 60);
    if (!name || !registrationId) {
      return res.status(400).json({ message: 'Contractor name and registration ID are required.' });
    }
    const contactEmail = req.body.contactEmail ? toText(req.body.contactEmail, 160) : '';
    if (contactEmail && !isValidEmail(contactEmail)) {
      return res.status(400).json({ message: 'The contact email does not look like an email address.' });
    }

    // The score an official enters is a starting point from past records. It
    // is replaced by real project evidence as it accumulates.
    const baselineScore = toNumberInRange(req.body.performanceScore, 0, 100, 100);

    const contractor = await Contractor.create({
      name,
      registrationId: registrationId.toUpperCase(),
      contactPerson: toText(req.body.contactPerson, 120) || '',
      contactEmail: contactEmail.toLowerCase(),
      phone: toText(req.body.phone, 20) || '',
      address: toText(req.body.address, 300) || '',
      expertise: toText(req.body.expertise, 200) || '',
      remarks: toText(req.body.remarks, 1000) || '',
      baselineScore,
      performanceScore: baselineScore,
      trustScore: baselineScore,
      completedOnTime: toNumberInRange(req.body.completedOnTime, 0, 100000, 0),
      delayedCount: toNumberInRange(req.body.delayedCount, 0, 100000, 0),
      averageBudgetVariance: toNumberInRange(req.body.averageBudgetVariance, -100, 1000, 0)
    });

    res.status(201).json(contractor);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A contractor with this registration ID already exists.' });
    }
    next(error);
  }
};

export const getContractorAnalysis = async (req, res, next) => {
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (!contractor) return res.status(404).json({ message: 'Contractor not found.' });

    const projects = await Project.find({ contractor: contractor._id })
      .select('title status lifecycleStatus completionScore riskLevel aiAssessment afterImageUrl projectHealth createdAt')
      .sort({ createdAt: -1 })
      .lean();
    const projectIds = projects.map((project) => project._id);
    const [feedback, acceptedComplaintCount] = await Promise.all([
      CitizenReport.find({ project: { $in: projectIds } })
        .select('description aiReport aiAssessment flaggedAsDiscrepancy status createdAt')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      CitizenReport.countDocuments({ project: { $in: projectIds }, status: COMPLAINT_STATUS.PUBLISHED })
    ]);

    // Same formula as the stored score, so the page and the leaderboard agree.
    const scores = computeContractorScores({
      projects,
      acceptedComplaintCount,
      baselineScore: contractor.baselineScore ?? contractor.performanceScore
    });

    const count = (status) => projects.filter((project) => project.status === status).length;

    res.json({
      contractor,
      metrics: {
        totalProjects: projects.length,
        completedProjects: projects.filter((project) => Boolean(project.afterImageUrl)).length,
        aiAssessedProjects: scores.assessedProjectCount,
        verifiedProjects: count('Verified'),
        flaggedProjects: count('Flagged'),
        pendingProjects: count('Pending'),
        // null when no project has a real AI comparison yet.
        averageCompletionScore: scores.averageCompletion,
        acceptedComplaints: acceptedComplaintCount,
        performanceScore: scores.performanceScore,
        trustScore: scores.trustScore
      },
      history: projects.map((project) => ({
        _id: project._id,
        title: project.title,
        status: project.status,
        lifecycleStatus: project.lifecycleStatus,
        completionScore: project.completionScore ?? null,
        aiStatus: project.aiAssessment?.status ?? null,
        riskLevel: project.riskLevel ?? null,
        createdAt: project.createdAt
      })),
      feedback: feedback.map((entry) => ({
        id: entry._id,
        title: entry.description,
        summary: entry.aiAssessment?.status === 'completed' && entry.aiReport ? entry.aiReport : entry.description,
        flagged: entry.status !== COMPLAINT_STATUS.REJECTED && entry.status !== COMPLAINT_STATUS.PUBLISHED,
        status: entry.status,
        createdAt: entry.createdAt
      })),
      chartData: [
        { name: 'Verified', value: count('Verified') },
        { name: 'Flagged', value: count('Flagged') },
        { name: 'Pending', value: count('Pending') }
      ]
    });
  } catch (error) {
    next(error);
  }
};
