// The two rules that decide who may do what with a complaint. They live here
// rather than inside the controller so they can be tested without a database:
// both of them are the kind of check that is expensive to get wrong.

// A citizen may only open their own complaint; officials may open any. The
// citizen field is sometimes a populated document and sometimes a raw id.
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

// The status field accepts every stage of the complaint's lifecycle, so without
// this list an official could skip inspection and jump straight to published.
export const ALLOWED_DECISIONS = ['Accepted', 'Rejected', 'Need More Evidence'];

export const isAllowedDecision = (decision) => ALLOWED_DECISIONS.includes(decision);
