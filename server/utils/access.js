// Who may do what with a complaint. Plain functions, so the rules can be
// tested without a database: these are the checks that are expensive to get wrong.
import { ROLES } from './roles.js';

export { ALLOWED_DECISIONS, isAllowedDecision } from './complaintWorkflow.js';

const idOf = (value) => value?._id ?? value;

// A citizen may only open their own complaint; officials may open any. The
// citizen field is sometimes a populated document and sometimes a raw id.
export const canViewReport = (req, report) => {
  if (req.isAuthority) return true;
  if (!req.isCitizen) return false;

  const owner = idOf(report?.citizen);
  if (!owner || !req.user?._id) return false;
  return String(owner) === String(req.user._id);
};

// Only the inspector a complaint is assigned to (or an Admin) may schedule or
// upload evidence for it. Without this any inspector could close any case.
export const canInspect = (req, report) => {
  if (!req.isAuthority || !req.user) return false;
  if (req.user.role === ROLES.ADMIN) return true;
  const assigned = idOf(report?.assignedOfficer);
  return Boolean(assigned) && String(assigned) === String(req.user._id);
};
