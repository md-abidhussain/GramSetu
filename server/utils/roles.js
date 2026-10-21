// One list of official roles, used by the model, routes and controllers.
export const ROLES = Object.freeze({
  ADMIN: 'Admin',
  DISTRICT_AUTHORITY: 'District Authority',
  GOVERNMENT_OFFICER: 'Government Officer',
  PWD_ENGINEER: 'PWD Engineer',
  INSPECTOR: 'Inspector'
});

export const ALL_OFFICIAL_ROLES = Object.freeze(Object.values(ROLES));

// Who may take each kind of decision. Kept here so the route table reads as
// a permissions table and tests can assert it.
export const PERMISSIONS = Object.freeze({
  manageOfficials: [ROLES.ADMIN],
  manageContractors: [ROLES.ADMIN, ROLES.DISTRICT_AUTHORITY, ROLES.PWD_ENGINEER],
  manageTenders: [ROLES.ADMIN, ROLES.DISTRICT_AUTHORITY, ROLES.PWD_ENGINEER],
  viewTenders: ALL_OFFICIAL_ROLES,
  createProject: [ROLES.ADMIN, ROLES.DISTRICT_AUTHORITY, ROLES.PWD_ENGINEER],
  completeProject: [ROLES.ADMIN, ROLES.PWD_ENGINEER, ROLES.INSPECTOR],
  advanceProject: ALL_OFFICIAL_ROLES,
  decideProject: [ROLES.ADMIN, ROLES.DISTRICT_AUTHORITY, ROLES.GOVERNMENT_OFFICER],
  assignInspector: [ROLES.ADMIN, ROLES.DISTRICT_AUTHORITY, ROLES.GOVERNMENT_OFFICER],
  inspect: [ROLES.ADMIN, ROLES.INSPECTOR],
  resolveComplaint: [ROLES.ADMIN, ROLES.DISTRICT_AUTHORITY, ROLES.GOVERNMENT_OFFICER],
  viewDashboard: ALL_OFFICIAL_ROLES
});
