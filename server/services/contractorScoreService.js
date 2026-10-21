import Contractor from '../models/Contractor.js';
import Project from '../models/Project.js';
import CitizenReport from '../models/CitizenReport.js';
import { COMPLAINT_STATUS } from '../utils/complaintWorkflow.js';

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

/**
 * The one formula for contractor scores (there used to be three, which
 * disagreed). Pure, so it is unit tested directly.
 *
 * Evidence used:
 *  - completion scores from REAL AI before/after comparisons only
 *  - complaints an official ACCEPTED after inspection (unreviewed ones do not count)
 *  - projects currently flagged
 * With no evidence at all, the contractor keeps the baseline score an official
 * entered when registering them.
 */
export const computeContractorScores = ({ projects, acceptedComplaintCount, baselineScore }) => {
  const assessed = projects.filter(
    (project) => project.aiAssessment?.status === 'completed' && typeof project.completionScore === 'number'
  );
  const averageCompletion = assessed.length
    ? assessed.reduce((sum, project) => sum + project.completionScore, 0) / assessed.length
    : null;

  const complaintPenalty = acceptedComplaintCount * 8;
  const flaggedCount = projects.filter((project) => project.status === 'Flagged').length;

  const performanceScore = clamp((averageCompletion ?? baselineScore ?? 100) - complaintPenalty);
  const trustScore = clamp(performanceScore - flaggedCount * 5);

  return {
    performanceScore,
    trustScore,
    assessedProjectCount: assessed.length,
    averageCompletion: averageCompletion === null ? null : Math.round(averageCompletion),
    completedOnTime: projects.filter((project) => project.afterImageUrl && project.projectHealth === 'Healthy').length,
    delayedCount: projects.filter((project) => project.projectHealth === 'Failed' || project.projectHealth === 'At Risk').length,
    citizenComplaintsCount: acceptedComplaintCount
  };
};

export const recalculateContractor = async (contractorId, session) => {
  if (!contractorId) return null;
  const contractor = await Contractor.findById(contractorId).session(session ?? null);
  if (!contractor) return null;

  const projects = await Project.find({ contractor: contractorId })
    .select('status projectHealth afterImageUrl completionScore aiAssessment')
    .session(session ?? null)
    .lean();
  const acceptedComplaintCount = await CitizenReport.countDocuments({
    project: { $in: projects.map((project) => project._id) },
    status: COMPLAINT_STATUS.PUBLISHED
  }).session(session ?? null);

  const scores = computeContractorScores({
    projects,
    acceptedComplaintCount,
    baselineScore: contractor.baselineScore ?? contractor.performanceScore
  });

  Object.assign(contractor, {
    performanceScore: scores.performanceScore,
    trustScore: scores.trustScore,
    completedOnTime: scores.completedOnTime,
    delayedCount: scores.delayedCount,
    citizenComplaintsCount: scores.citizenComplaintsCount,
    pastProjects: projects.map((project) => project._id)
  });
  await contractor.save({ session });
  return contractor;
};
