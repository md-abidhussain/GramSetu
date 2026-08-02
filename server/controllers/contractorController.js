import Contractor from '../models/Contractor.js';
import Project from '../models/Project.js';
import CitizenReport from '../models/CitizenReport.js';

export const getContractors = async (req, res, next) => {
  try {
    const contractors = await Contractor.find().sort({ performanceScore: -1 });
    res.json(contractors);
  } catch (error) {
    next(error);
  }
};

export const createContractor = async (req, res, next) => {
  try {
    const {
      name,
      registrationId,
      contactPerson,
      contactEmail,
      phone,
      address,
      expertise,
      remarks,
      performanceScore,
      completedOnTime,
      delayedCount,
      averageBudgetVariance
    } = req.body;

    if (!name || !registrationId) {
      return res.status(400).json({ message: 'Contractor name and registration ID are required' });
    }

    const contractor = await Contractor.create({
      name,
      registrationId,
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      phone: phone || '',
      address: address || '',
      expertise: expertise || '',
      remarks: remarks || '',
      performanceScore: Number(performanceScore) || 100,
      completedOnTime: Number(completedOnTime) || 0,
      delayedCount: Number(delayedCount) || 0,
      averageBudgetVariance: Number(averageBudgetVariance) || 0
    });

    res.status(201).json(contractor);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A contractor with this registration ID already exists' });
    }
    next(error);
  }
};

export const getContractorAnalysis = async (req, res, next) => {
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (!contractor) {
      return res.status(404).json({ message: 'Contractor not found' });
    }

    const projects = await Project.find({ contractor: contractor._id })
      .populate(['tender', 'contractor'])
      .sort({ createdAt: -1 });

    const projectIds = projects.map((project) => project._id);
    const feedback = await CitizenReport.find({ project: { $in: projectIds } })
      .sort({ createdAt: -1 });

    const totalProjects = projects.length;
    const completedProjects = projects.filter((project) => Boolean(project.afterImageUrl)).length;
    const verifiedProjects = projects.filter((project) => project.status === 'Verified').length;
    const flaggedProjects = projects.filter((project) => project.status === 'Flagged').length;
    const pendingProjects = projects.filter((project) => project.status === 'Pending').length;

    const averageCompletionScore = totalProjects > 0
      ? Math.round(projects.reduce((sum, project) => sum + (project.completionScore || 0), 0) / totalProjects)
      : contractor.performanceScore;

    const onTimeRate = totalProjects > 0
      ? Math.round((projects.filter((project) => (project.completionScore || 0) >= 80).length / totalProjects) * 100)
      : 100;

    const trustScore = Math.max(0, Math.min(100, Math.round((averageCompletionScore * 0.5) + (onTimeRate * 0.3) + ((verifiedProjects / Math.max(1, totalProjects)) * 20))));

    const remarks = feedback.slice(0, 6).map((entry) => ({
      id: entry._id,
      title: entry.description || 'Citizen feedback',
      summary: entry.aiReport || entry.description || 'Citizen observation recorded.',
      flagged: entry.flaggedAsDiscrepancy || entry.status === 'Resolved' ? false : true,
      createdAt: entry.createdAt
    }));

    res.json({
      contractor,
      metrics: {
        totalProjects,
        completedProjects,
        verifiedProjects,
        flaggedProjects,
        pendingProjects,
        averageCompletionScore,
        onTimeRate,
        trustScore
      },
      history: projects.map((project) => ({
        _id: project._id,
        title: project.title,
        status: project.status,
        lifecycleStatus: project.lifecycleStatus,
        completionScore: project.completionScore || 0,
        riskLevel: project.riskLevel || 'Low',
        createdAt: project.createdAt
      })),
      feedback: remarks,
      chartData: [
        { name: 'Verified', value: verifiedProjects },
        { name: 'Flagged', value: flaggedProjects },
        { name: 'Pending', value: pendingProjects }
      ]
    });
  } catch (error) {
    next(error);
  }
};
