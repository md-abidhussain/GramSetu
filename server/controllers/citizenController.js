import CitizenReport from '../models/CitizenReport.js';
import Project from '../models/Project.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';
import Reward from '../models/Reward.js';
import { storeFile, removeStoredFile } from '../services/cloudinaryService.js';
import { assessComplaintPhoto, assessRepairEvidence } from '../services/ai/assessments.js';
import { detectDefects } from '../services/segmentationService.js';
import { recalculateContractor } from '../services/contractorScoreService.js';
import { notifyOfficials, notifyUser } from '../services/notificationService.js';
import { generateCitizenComplaintPDF } from '../services/pdfReportService.js';
import { isValidId, toLatitude, toLongitude, toText } from '../utils/validators.js';
import { canInspect, canViewReport } from '../utils/access.js';
import { COMPLAINT_STATUS, DECISIONS, OPEN_STATUSES, STEP_FROM, isAllowedDecision } from '../utils/complaintWorkflow.js';
import { assessSeverity } from '../utils/severity.js';
import { distanceInMeters } from '../utils/geo.js';
import { readPagination, setPaginationHeaders } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { ROLES } from '../utils/roles.js';

export const GEO_VERIFY_RADIUS_METERS = 150;
export const DUPLICATE_RADIUS_DEGREES = 0.0005; // about 55 m
export const REWARD_POINTS = 150;

const DECIDING_ROLES = [ROLES.ADMIN, ROLES.DISTRICT_AUTHORITY, ROLES.GOVERNMENT_OFFICER];

const reportQuery = (query, { forOfficial }) => {
  query
    .populate('assignedOfficer', 'name role uniqueUserId')
    .populate({ path: 'project', select: 'title location status lifecycleStatus contractor', populate: { path: 'contractor', select: 'name registrationId' } });
  // Officials need to contact the person; citizens already know who they are.
  if (forOfficial) query.populate('citizen', 'name email phone');
  return query;
};

/** Explains a refused workflow step: 404 if the complaint is gone, else 409 with its current state. */
const conflictOrMissing = async (res, reportId, action) => {
  const current = await CitizenReport.findById(reportId).select('status').lean();
  if (!current) return res.status(404).json({ message: 'Complaint not found.' });
  return res.status(409).json({ message: `This complaint is "${current.status}", so it cannot be ${action} now.`, status: current.status });
};

// ---------------------------------------------------------------- citizen

export const createCitizenReport = async (req, res, next) => {
  let stored = null;
  try {
    const { projectId, lat, lng, description, customProjectTitle } = req.body;

    if (!projectId) return res.status(400).json({ message: 'Choose a project, or "custom" for another place.' });
    const reportText = toText(description, 2000);
    if (!reportText) return res.status(400).json({ message: 'Describe the problem in 2000 characters or fewer.' });

    // Not tested for truthiness: 0 is a real coordinate.
    const latitude = toLatitude(lat);
    const longitude = toLongitude(lng);
    if (latitude === null || longitude === null) {
      return res.status(400).json({ message: 'Please give a valid location on the map.' });
    }

    const isCustom = projectId === 'custom';
    let customTitle = null;
    if (isCustom) {
      customTitle = toText(customProjectTitle, 200);
      if (!customTitle) return res.status(400).json({ message: 'Give the place a name of 200 characters or fewer.' });
    } else if (!isValidId(projectId)) {
      return res.status(400).json({ message: 'That project does not exist.' });
    }

    if (!req.file) return res.status(400).json({ message: 'A photo of the problem is required.' });

    let project = null;
    if (!isCustom) {
      project = await Project.findById(projectId).select('title location afterImageUrl beforeImageUrl').lean();
      if (!project) return res.status(404).json({ message: 'Project not found.' });
    }

    // Is the citizen standing near the project they are reporting?
    let geoVerified = null;
    let distanceFromProjectMeters = null;
    if (project?.location) {
      distanceFromProjectMeters = Math.round(distanceInMeters(project.location, { lat: latitude, lng: longitude }));
      geoVerified = distanceFromProjectMeters <= GEO_VERIFY_RADIUS_METERS;
    }

    const duplicate = await CitizenReport.findOne({
      status: { $in: OPEN_STATUSES },
      'gps.lat': { $gte: latitude - DUPLICATE_RADIUS_DEGREES, $lte: latitude + DUPLICATE_RADIUS_DEGREES },
      'gps.lng': { $gte: longitude - DUPLICATE_RADIUS_DEGREES, $lte: longitude + DUPLICATE_RADIUS_DEGREES }
    }).select('_id').lean();

    // The photo is analysed from memory before it is stored, so a storage
    // outage does not lose the citizen's report silently and the AI does not
    // need to download what we already hold.
    const photo = { buffer: req.file.buffer, mimeType: req.file.mimetype };
    const baselineUrl = project ? project.afterImageUrl || project.beforeImageUrl : null;
    const [ai, segmentation] = await Promise.all([
      assessComplaintPhoto(photo, baselineUrl),
      detectDefects(req.file, null)
    ]);
    const { severity, basis } = assessSeverity({ ai, segmentation });

    stored = await storeFile(req.file, 'citizen_reports');

    const report = await CitizenReport.create({
      citizen: req.user._id,
      project: project?._id,
      customProjectTitle: project ? undefined : customTitle,
      citizenImageUrl: stored.url,
      citizenImagePublicId: stored.publicId,
      gps: { lat: latitude, lng: longitude },
      geoVerified,
      distanceFromProjectMeters,
      description: reportText,
      aiAssessment: { status: ai.status, reason: ai.reason, model: ai.model, assessedAt: ai.assessedAt },
      ...(ai.status === 'completed'
        ? {
            detectedIssues: ai.detectedIssues,
            aiReport: ai.report,
            matchScore: ai.matchScore,
            flaggedAsDiscrepancy: ai.flaggedAsDiscrepancy
          }
        : {}),
      segmentation,
      severity,
      severityBasis: basis,
      duplicateFound: Boolean(duplicate),
      duplicateOf: duplicate?._id ?? null,
      status: duplicate ? COMPLAINT_STATUS.DUPLICATE : COMPLAINT_STATUS.SUBMITTED
    });
    stored = null; // now owned by the saved report

    // Project and contractor scores are NOT changed here. An unreviewed
    // complaint is an allegation; it counts only once an official accepts it.
    await notifyOfficials(
      `${duplicate ? '[Possible duplicate] ' : ''}New complaint at ${project ? `"${project.title}"` : `"${customTitle}"`}. Severity: ${severity}.`,
      { type: severity === 'High' ? 'danger' : 'warning', roles: DECIDING_ROLES }
    );

    const saved = await reportQuery(CitizenReport.findById(report._id), { forOfficial: false });
    res.status(201).json(saved);
  } catch (error) {
    if (stored) await removeStoredFile(stored);
    next(error);
  }
};

export const getCitizenReports = async (req, res, next) => {
  try {
    const filter = {};
    if (req.isCitizen) {
      filter.citizen = req.user._id;
    } else if (req.query.assignedToMe === 'true') {
      filter.assignedOfficer = req.user._id;
    }
    if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status;

    const pagination = readPagination(req.query);
    const [reports, total] = await Promise.all([
      reportQuery(CitizenReport.find(filter), { forOfficial: req.isAuthority })
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      CitizenReport.countDocuments(filter)
    ]);
    setPaginationHeaders(res, pagination, total);
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

export const getCitizenReportById = async (req, res, next) => {
  try {
    const report = await reportQuery(CitizenReport.findById(req.params.id), { forOfficial: req.isAuthority });
    // Same answer for "missing" and "someone else's", so ids cannot be probed.
    if (!report || !canViewReport(req, report)) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const downloadCitizenReport = async (req, res, next) => {
  try {
    const complaint = await reportQuery(CitizenReport.findById(req.params.id), { forOfficial: req.isAuthority });
    if (!complaint || !canViewReport(req, complaint)) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="complaint-report-${complaint._id}.pdf"`);
    await generateCitizenComplaintPDF(complaint, res);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------- officials

export const assignInspector = async (req, res, next) => {
  try {
    const { reportId, inspectorId } = req.body;
    if (!isValidId(reportId) || !isValidId(inspectorId)) {
      return res.status(400).json({ message: 'Choose a complaint and an inspector.' });
    }

    const inspector = await Authority.findById(inspectorId).select('name role').lean();
    if (!inspector || inspector.role !== ROLES.INSPECTOR) {
      return res.status(400).json({ message: 'That official is not an inspector.' });
    }

    const report = await CitizenReport.findOneAndUpdate(
      { _id: reportId, status: { $in: STEP_FROM.assign } },
      {
        $set: {
          assignedOfficer: inspector._id,
          status: COMPLAINT_STATUS.ASSIGNED,
          resolutionEta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      { new: true }
    );
    if (!report) return conflictOrMissing(res, reportId, 'assigned');

    await notifyUser(inspector._id, 'Authority', `You have been assigned complaint #${String(report._id).slice(-6)}.`, 'info');
    await notifyUser(report.citizen, 'Citizen', 'An inspector has been assigned to your complaint.', 'info');
    res.json(report);
  } catch (error) {
    next(error);
  }
};

const loadForInspection = async (req, res, reportId) => {
  if (!isValidId(reportId)) {
    res.status(400).json({ message: 'That complaint does not exist.' });
    return null;
  }
  const report = await CitizenReport.findById(reportId).select('status assignedOfficer citizen citizenImageUrl');
  if (!report) {
    res.status(404).json({ message: 'Complaint not found.' });
    return null;
  }
  if (!canInspect(req, report)) {
    res.status(403).json({ message: 'Only the inspector assigned to this complaint can do this.' });
    return null;
  }
  return report;
};

export const scheduleInspection = async (req, res, next) => {
  try {
    const { reportId, date } = req.body;
    const report = await loadForInspection(req, res, reportId);
    if (!report) return;

    const scheduledFor = new Date(date);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() < now - oneDay || scheduledFor.getTime() > now + 365 * oneDay) {
      return res.status(400).json({ message: 'Choose an inspection date between today and one year from now.' });
    }

    const updated = await CitizenReport.findOneAndUpdate(
      { _id: report._id, status: { $in: STEP_FROM.schedule } },
      { $set: { inspectionDate: scheduledFor, status: COMPLAINT_STATUS.SCHEDULED } },
      { new: true }
    );
    if (!updated) return conflictOrMissing(res, report._id, 'scheduled');
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const uploadInspectionVerification = async (req, res, next) => {
  let stored = null;
  try {
    const { reportId } = req.body;
    const report = await loadForInspection(req, res, reportId);
    if (!report) return;

    // Checked before any upload or AI call, so a refused request costs nothing.
    if (!STEP_FROM.uploadEvidence.includes(report.status)) return conflictOrMissing(res, report._id, 'given new evidence');
    if (!req.file) return res.status(400).json({ message: 'A photo from the inspection is required.' });

    const notes = req.body.inspectorNotes ? toText(req.body.inspectorNotes, 2000) : '';
    if (req.body.inspectorNotes && !notes) return res.status(400).json({ message: 'Keep inspection notes to 2000 characters.' });

    const repair = await assessRepairEvidence(report.citizenImageUrl, { buffer: req.file.buffer, mimeType: req.file.mimetype });
    stored = await storeFile(req.file, 'inspection_evidence');

    const updated = await CitizenReport.findOneAndUpdate(
      { _id: report._id, status: { $in: STEP_FROM.uploadEvidence } },
      {
        $set: {
          inspectorBeforeImageUrl: report.citizenImageUrl,
          inspectorAfterImageUrl: stored.url,
          inspectorImagePublicId: stored.publicId,
          inspectorNotes: notes,
          repairAssessment: repair,
          // One honest state. It used to step through "Gemini Analysis" and
          // "AI Agent Validation" without calling any AI.
          status: COMPLAINT_STATUS.EVIDENCE_UPLOADED
        }
      },
      { new: true }
    );
    if (!updated) return conflictOrMissing(res, report._id, 'given new evidence');
    stored = null;

    await notifyOfficials(`Inspection evidence uploaded for complaint #${String(report._id).slice(-6)}. Awaiting a decision.`, {
      roles: DECIDING_ROLES
    });
    res.json(updated);
  } catch (error) {
    if (stored) await removeStoredFile(stored);
    next(error);
  }
};

const badgesFor = (points) => [
  ...(points >= 150 ? ['Verified Contributor'] : []),
  ...(points >= 300 ? ['Civic Leader'] : [])
];

export const resolveComplaint = async (req, res, next) => {
  try {
    const { reportId, decision } = req.body;
    if (!isValidId(reportId)) return res.status(400).json({ message: 'That complaint does not exist.' });
    if (!isAllowedDecision(decision)) {
      return res.status(400).json({ message: 'Decision must be Accepted, Rejected, or Need More Evidence.' });
    }
    const summary = req.body.resolutionSummary ? toText(req.body.resolutionSummary, 2000) : '';
    if (req.body.resolutionSummary && !summary) return res.status(400).json({ message: 'Keep the summary to 2000 characters.' });

    const { step, to } = DECISIONS[decision];

    const outcome = await withTransaction(async (session) => {
      // The status condition makes this the only request that can win: a
      // second "Accept" finds the complaint already published and changes nothing.
      const report = await CitizenReport.findOneAndUpdate(
        { _id: reportId, status: { $in: STEP_FROM[step] } },
        {
          $set: {
            status: to,
            resolutionSummary: summary,
            decidedBy: req.user._id,
            decidedAt: new Date(),
            ...(step === 'accept' ? { rewardGranted: true } : {})
          }
        },
        { new: true, session }
      );
      if (!report) return null;

      if (step === 'accept') {
        if (report.citizen) {
          const citizen = await Citizen.findByIdAndUpdate(
            report.citizen,
            { $inc: { points: REWARD_POINTS, volunteerScore: 10 } },
            { new: true, session }
          );
          if (citizen) {
            await Citizen.updateOne({ _id: citizen._id }, { $addToSet: { badges: { $each: badgesFor(citizen.points) } } }, { session });
            await Reward.create([{
              citizen: citizen._id,
              rewardType: 'Citizen Points',
              amount: REWARD_POINTS,
              title: 'Verified complaint',
              description: `${REWARD_POINTS} civic points for a complaint an official verified after inspection.`,
              complaint: report._id
            }], { session });
          }
        }

        // A verified complaint now affects the project, but only when the
        // citizen was actually at the project site.
        if (report.project && report.geoVerified !== false) {
          const project = await Project.findById(report.project).session(session);
          if (project) {
            project.verifiedComplaintCount = (project.verifiedComplaintCount || 0) + 1;
            project.complaintCount = project.verifiedComplaintCount;
            project.status = 'Flagged';
            if (project.verifiedComplaintCount >= 3) {
              project.projectHealth = 'Failed';
              project.suggestedMaintenance = true;
              project.healthPercentage = Math.max(15, project.healthPercentage - 30);
            } else {
              project.projectHealth = 'At Risk';
              project.healthPercentage = Math.max(40, project.healthPercentage - 15);
            }
            await project.save({ session });
            await recalculateContractor(project.contractor, session);
          }
        }
      }
      return report;
    });

    if (!outcome) return conflictOrMissing(res, reportId, `marked "${decision}"`);

    await notifyUser(outcome.citizen, 'Citizen', `Your complaint was updated: ${outcome.status}.`, step === 'accept' ? 'success' : 'info');
    res.json(outcome);
  } catch (error) {
    next(error);
  }
};
