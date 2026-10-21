// Project lifecycle. Officials may make the MANUAL steps. The two AI steps
// ("Waiting for AI Verification", "AI Verified") are SYSTEM steps: only the
// completion upload and a real AI comparison can produce them, so nobody can
// click a project to "AI Verified" without an AI result behind it.

export const LIFECYCLE = Object.freeze({
  TENDER_PUBLISHED: 'Tender Published',
  CREATED: 'Project Created',
  CONSTRUCTION: 'Construction Started',
  AWAITING_AI: 'Waiting for AI Verification',
  AI_VERIFIED: 'AI Verified',
  CITIZEN_VERIFICATION: 'Citizen Verification',
  AUTHORITY_REVIEW: 'Under Authority Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  MAINTENANCE: 'Maintenance Required'
});

const L = LIFECYCLE;

export const MANUAL_TRANSITIONS = Object.freeze({
  [L.TENDER_PUBLISHED]: [L.CREATED],
  [L.CREATED]: [L.CONSTRUCTION],
  [L.AI_VERIFIED]: [L.CITIZEN_VERIFICATION],
  [L.CITIZEN_VERIFICATION]: [L.AUTHORITY_REVIEW],
  [L.AUTHORITY_REVIEW]: [L.APPROVED, L.REJECTED, L.MAINTENANCE]
});

export const FINAL_DECISIONS = Object.freeze([L.APPROVED, L.REJECTED, L.MAINTENANCE]);

export const allowedManualSteps = (current) => MANUAL_TRANSITIONS[current] || [];

export const canMoveManually = (current, next) => allowedManualSteps(current).includes(next);
