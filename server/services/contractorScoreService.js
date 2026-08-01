import Contractor from '../models/Contractor.js';
import Project from '../models/Project.js';
import CitizenReport from '../models/CitizenReport.js';

/**
 * Dynamically recalculates a contractor's performance score and metrics.
 * Triggers on project completion, citizen report verification, or status change.
 * @param {string} contractorId - The ObjectId of the contractor
 */
export const updateContractorScore = async (contractorId) => {
  try {
    const contractor = await Contractor.findById(contractorId);
    if (!contractor) {
      throw new Error(`Contractor with ID ${contractorId} not found`);
    }

    // 1. Fetch all projects linked to this contractor
    const projects = await Project.find({ contractor: contractorId });
    const projectIds = projects.map(p => p._id);

    // 2. Fetch all citizen reports linked to these projects
    const citizenReports = await CitizenReport.find({ project: { $in: projectIds } });

    // 3. Calculate metrics
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.afterImageUrl);
    const completedCount = completedProjects.length;

    // Calculate average completion score (default to 100 if no completed projects yet)
    let averageCompletion = 100;
    if (completedCount > 0) {
      const sumCompletion = completedProjects.reduce((sum, p) => sum + (p.completionScore || 0), 0);
      averageCompletion = sumCompletion / completedCount;
    }

    // Calculate citizen complaints discrepancy deduction
    // Deduct 8 points for each flagged citizen report discrepancy
    const flaggedCount = citizenReports.filter(report => report.flaggedAsDiscrepancy).length;
    const complaintDeduction = flaggedCount * 8;

    // Calculate performance score (clamp between 0 and 100)
    let performanceScore = Math.round(averageCompletion - complaintDeduction);
    performanceScore = Math.max(0, Math.min(100, performanceScore));

    // Update contractor stats
    contractor.performanceScore = performanceScore;
    contractor.pastProjects = projectIds;
    
    // Calculate simple delayed count vs completed on time based on project health
    const delayedCount = projects.filter(p => p.projectHealth === 'Failed' || p.projectHealth === 'At Risk').length;
    const completedOnTime = projects.filter(p => p.afterImageUrl && p.projectHealth === 'Healthy').length;

    contractor.delayedCount = delayedCount;
    contractor.completedOnTime = completedOnTime;

    // Save and return
    await contractor.save();
    console.log(`Updated contractor ${contractor.name} score to: ${performanceScore}`);
    return contractor;
  } catch (error) {
    console.error('Error updating contractor performance metrics:', error);
    throw error;
  }
};
