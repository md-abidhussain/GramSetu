// The two rules that decide who may do what with a complaint. They live here
// rather than inside the controller so they can be tested without a database:
// both of them are the kind of check that is expensive to get wrong.

/**
 * A citizen may only open their own complaint. Officials may open any.
 *
 * The report's citizen field is sometimes a populated document and sometimes a
 * raw id, so both are compared as strings.
 */
export const canViewReport = (req, report) => {
  if (!req.isCitizen) {
    return true;
  }

  const owner = report?.citizen?._id ?? report?.citizen;
  if (!owner || !req.user?._id) {
    return false;
  }

  return String(owner) === String(req.user._id);
};

/**
 * What an official is allowed to decide when reviewing a complaint.
 *
 * The complaint's status field accepts every stage of its lifecycle, so
 * without this list an official could post any stage and jump a complaint
 * straight to published, skipping inspection.
 */
export const ALLOWED_DECISIONS = ['Accepted', 'Rejected', 'Need More Evidence'];

export const isAllowedDecision = (decision) => ALLOWED_DECISIONS.includes(decision);
