// The complaint lifecycle as a table. A step is only allowed from the states
// listed for it, and controllers apply it with a conditional update
// (status must still be one of these) so two simultaneous requests cannot
// both succeed: for example, a double-clicked "Accept" paying points twice.

export const COMPLAINT_STATUS = Object.freeze({
  SUBMITTED: 'Authority Notification',
  DUPLICATE: 'Duplicate Detected',
  ASSIGNED: 'Inspector Assigned',
  SCHEDULED: 'Inspection Scheduled',
  EVIDENCE_UPLOADED: 'Inspector Uploads Verification',
  NEED_MORE_EVIDENCE: 'Need More Evidence',
  REJECTED: 'Rejected',
  PUBLISHED: 'Resolution Published'
});

const S = COMPLAINT_STATUS;

export const OPEN_STATUSES = Object.freeze([S.SUBMITTED, S.DUPLICATE, S.ASSIGNED, S.SCHEDULED, S.EVIDENCE_UPLOADED, S.NEED_MORE_EVIDENCE]);

export const STEP_FROM = Object.freeze({
  assign: [S.SUBMITTED, S.DUPLICATE, S.NEED_MORE_EVIDENCE, S.ASSIGNED],
  schedule: [S.ASSIGNED, S.SCHEDULED],
  uploadEvidence: [S.ASSIGNED, S.SCHEDULED, S.NEED_MORE_EVIDENCE],
  accept: [S.EVIDENCE_UPLOADED],
  requestMoreEvidence: [S.EVIDENCE_UPLOADED],
  // A complaint can be turned down without an inspection (spam, out of
  // jurisdiction), but not once it has been resolved.
  reject: [S.SUBMITTED, S.DUPLICATE, S.ASSIGNED, S.SCHEDULED, S.EVIDENCE_UPLOADED, S.NEED_MORE_EVIDENCE]
});

export const DECISIONS = Object.freeze({
  Accepted: { step: 'accept', to: S.PUBLISHED },
  Rejected: { step: 'reject', to: S.REJECTED },
  'Need More Evidence': { step: 'requestMoreEvidence', to: S.NEED_MORE_EVIDENCE }
});

export const ALLOWED_DECISIONS = Object.freeze(Object.keys(DECISIONS));

export const isAllowedDecision = (decision) => typeof decision === 'string' && Object.hasOwn(DECISIONS, decision);

export const canApply = (step, currentStatus) => (STEP_FROM[step] || []).includes(currentStatus);
