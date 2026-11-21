import Project from '../models/Project.js';
import Tender from '../models/Tender.js';
import { storeFile, removeStoredFile } from '../services/cloudinaryService.js';
import { compareBeforeAfter } from '../services/ai/assessments.js';
import { recalculateContractor } from '../services/contractorScoreService.js';
import { notifyOfficials } from '../services/notificationService.js';
import { generateProjectAuditPDF } from '../services/pdfReportService.js';
import { fetchImage } from '../utils/fetchImage.js';
import { isValidId, toLatitude, toLongitude, toText } from '../utils/validators.js';
import { FINAL_DECISIONS, LIFECYCLE, allowedManualSteps, canMoveManually } from '../utils/projectLifecycle.js';
import { readPagination, setPaginationHeaders } from '../utils/pagination.js';
import { PERMISSIONS } from '../utils/roles.js';

// What anyone may see about a public works project. Tender text, the tender
// PDF, budgets and contractor contact details are for officials only.
const PUBLIC_FIELDS = [
  'title', 'location', 'status', 'lifecycleStatus', 'projectHealth', 'healthPercentage',
  'completionScore', 'riskLevel', 'aiAssessment', 'aiComparisonNotes', 'beforeImageUrl', 'afterImageUrl',
  'contractor', 'tender', 'verifiedComplaintCount', 'dataSource', 'createdAt'
].join(' ');

const projectQuery = (query, req) => {
  if (req.isAuthority) {
    return query
      .populate('contractor', 'name registrationId contactPerson contactEmail phone trustScore performanceScore')
      .populate('tender', 'title budgetAllocated riskLevel riskScore timelineStart timelineEnd fileUrl aiAssessment');
  }
  return query.select(PUBLIC_FIELDS).populate('contractor', 'name').populate('tender', 'title');
};

const historyEntry = (status, updatedBy, remarks) => ({ status, updatedBy, remarks, timestamp: new Date() });

export const createProject = async (req, res, next) => {
  let stored = null;
  try {
    const { title, tenderId, lat, lng, address } = req.body;
    const projectTitle = toText(title, 200);
    if (!projectTitle) return res.status(400).json({ message: 'Give the project a title of 200 characters or fewer.' });
    if (!isValidId(tenderId)) return res.status(400).json({ message: 'Choose the tender this project belongs to.' });

    const latitude = toLatitude(lat);
    const longitude = toLongitude(lng);
    if (latitude === null || longitude === null) {
      return res.status(400).json({ message: 'Please give a valid location for the project.' });
    }

    const projectAddress = address ? toText(address, 300) : '';
    if (address && !projectAddress) return res.status(400).json({ message: 'Shorten the address to 300 characters or fewer.' });
    if (!req.file) return res.status(400).json({ message: 'A "before" photo is required.' });

    const tender = await Tender.findById(tenderId).select('contractor').lean();
    if (!tender) return res.status(404).json({ message: 'Tender not found.' });

    stored = await storeFile(req.file, 'projects/before');
    const project = await Project.create({
      title: projectTitle,
      tender: tender._id,
      contractor: tender.contractor,
      location: { lat: latitude, lng: longitude, address: projectAddress },
      beforeImageUrl: stored.url,
      beforeImagePublicId: stored.publicId,
      status: 'Pending',
      lifecycleStatus: LIFECYCLE.CREATED,
      statusHistory: [historyEntry(LIFECYCLE.CREATED, req.user.name, 'Project created from tender.')]
    });
    stored = null;

    res.status(201).json(await projectQuery(Project.findById(project._id), req));
  } catch (error) {
    if (stored) await removeStoredFile(stored);
    next(error);
  }
};

/** Writes an AI comparison onto a project and advances the lifecycle only if it really ran. */
const applyComparison = (project, comparison, actor) => {
  project.aiAssessment = { status: comparison.status, reason: comparison.reason, model: comparison.model, assessedAt: comparison.assessedAt };
  if (comparison.status === 'completed') {
    project.completionScore = comparison.completionScore;
    project.riskLevel = comparison.riskLevel;
    project.projectHealth = comparison.projectHealth;
    project.aiComparisonNotes = comparison.notes;
    project.status = comparison.completionScore >= 80 ? 'Verified' : 'Flagged';
    project.lifecycleStatus = LIFECYCLE.AI_VERIFIED;
    project.statusHistory.push(historyEntry(LIFECYCLE.AI_VERIFIED, 'AI comparison', `Completion score ${comparison.completionScore}% (${comparison.model}).`));
  } else {
    // No scores are written. The project waits until the comparison can run.
    project.completionScore = null;
    project.riskLevel = null;
    project.aiComparisonNotes = undefined;
    project.status = 'Pending';
    project.statusHistory.push(historyEntry(LIFECYCLE.AWAITING_AI, actor, `AI comparison did not run (${comparison.reason || comparison.status}). Retry from the project page.`));
  }
};

export const completeProject = async (req, res, next) => {
  let stored = null;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Checked before the upload and the AI call, which both cost money.
    if (project.lifecycleStatus !== LIFECYCLE.CONSTRUCTION) {
      return res.status(409).json({
        message: `Completion photos can be added once construction has started. This project is "${project.lifecycleStatus}".`
      });
    }
    if (!project.beforeImageUrl) return res.status(409).json({ message: 'This project has no "before" photo to compare against.' });
    if (!req.file) return res.status(400).json({ message: 'An "after" photo is required.' });

    const comparison = await compareBeforeAfter(project.beforeImageUrl, { buffer: req.file.buffer, mimeType: req.file.mimetype });
    stored = await storeFile(req.file, 'projects/after');

    project.afterImageUrl = stored.url;
    project.afterImagePublicId = stored.publicId;
    project.lifecycleStatus = LIFECYCLE.AWAITING_AI;
    project.statusHistory.push(historyEntry(LIFECYCLE.AWAITING_AI, req.user.name, 'Completion photo uploaded.'));
    applyComparison(project, comparison, req.user.name);

    // Optimistic concurrency: if someone else changed this project meanwhile, save() fails.
    await project.save();
    stored = null;

    await recalculateContractor(project.contractor);
    await notifyOfficials(
      comparison.status === 'completed'
        ? `Project "${project.title}" was compared by AI: ${project.completionScore}% complete.`
        : `Project "${project.title}" has a completion photo, but the AI comparison could not run. It needs a retry.`,
      { type: comparison.status === 'completed' ? (project.status === 'Verified' ? 'success' : 'warning') : 'warning' }
    );

    res.json(await projectQuery(Project.findById(project._id), req));
  } catch (error) {
    if (stored) await removeStoredFile(stored);
    next(error);
  }
};

/** Re-runs the comparison for a project whose AI step failed earlier. */
export const retryAiVerification = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (project.lifecycleStatus !== LIFECYCLE.AWAITING_AI || !project.afterImageUrl) {
      return res.status(409).json({ message: 'Only a project waiting for AI verification can be retried.' });
    }

    let after;
    try {
      after = await fetchImage(project.afterImageUrl);
    } catch (error) {
      return next(error);
    }
    const comparison = await compareBeforeAfter(project.beforeImageUrl, after);
    applyComparison(project, comparison, req.user.name);
    await project.save();
    await recalculateContractor(project.contractor);
    res.json(await projectQuery(Project.findById(project._id), req));
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const pagination = readPagination(req.query);
    const [projects, total] = await Promise.all([
      // lean(): plain objects instead of full Mongoose documents. Read-only
      // lists do not need change tracking, and it roughly halves the CPU cost.
      projectQuery(Project.find(), req).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
      Project.estimatedDocumentCount()
    ]);
    setPaginationHeaders(res, pagination, total);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectQuery(Project.findById(req.params.id), req);
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjectLifecycle = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).select('lifecycleStatus statusHistory').lean();
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const history = [...(project.statusHistory || [])]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      // Officials' names are internal; the public sees what happened and when.
      .map((entry) => (req.isAuthority ? entry : { status: entry.status, timestamp: entry.timestamp, remarks: entry.remarks }));

    res.json({
      currentStatus: project.lifecycleStatus,
      allowedNextStatuses: req.isAuthority ? allowedManualSteps(project.lifecycleStatus) : [],
      history
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectLifecycle = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (typeof status !== 'string' || !status) return res.status(400).json({ message: 'Choose the next stage.' });
    const remarks = req.body.remarks ? toText(req.body.remarks, 1000) : '';
    if (req.body.remarks && !remarks) return res.status(400).json({ message: 'Keep remarks to 1000 characters.' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (!canMoveManually(project.lifecycleStatus, status)) {
      const allowed = allowedManualSteps(project.lifecycleStatus);
      return res.status(409).json({
        message: allowed.length
          ? `From "${project.lifecycleStatus}" the next stage can be: ${allowed.join(', ')}.`
          : `"${project.lifecycleStatus}" cannot be changed by hand.`
      });
    }
    if (FINAL_DECISIONS.includes(status) && !PERMISSIONS.decideProject.includes(req.user.role)) {
      return res.status(403).json({ message: 'Only a District Authority, Government Officer or Admin can make the final decision.' });
    }

    project.lifecycleStatus = status;
    project.statusHistory.push(historyEntry(status, req.user.name, remarks));
    if (status === LIFECYCLE.APPROVED) project.status = 'Verified';
    if (status === LIFECYCLE.REJECTED || status === LIFECYCLE.MAINTENANCE) project.status = 'Flagged';
    await project.save();

    if (FINAL_DECISIONS.includes(status)) await recalculateContractor(project.contractor);
    await notifyOfficials(`Project "${project.title}" moved to ${status}.`);

    res.json(await projectQuery(Project.findById(project._id), req));
  } catch (error) {
    next(error);
  }
};

export const downloadProjectReport = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('contractor', 'name').populate('tender', 'title');
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Allow download for sample demonstration projects, or authenticated officials
    if (project.dataSource !== 'sample' && !req.user) {
      return res.status(401).json({ message: 'Authentication required to download non-sample project reports.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-report-${project._id}.pdf"`);
    await generateProjectAuditPDF(project, res);
  } catch (error) {
    next(error);
  }
};
