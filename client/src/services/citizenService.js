import { request } from './api.js';

export const submitCitizenReport = (formData) => {
  return request('/citizen-reports', {
    method: 'POST',
    body: formData,
  });
};

export const getCitizenReports = () => request('/citizen-reports');

export const getCitizenReportById = (id) => request(`/citizen-reports/${id}`);

export const assignInspector = (reportId, inspectorId) => {
  return request('/citizen-reports/assign-inspector', {
    method: 'POST',
    body: JSON.stringify({ reportId, inspectorId }),
  });
};

export const scheduleInspection = (reportId, date) => {
  return request('/citizen-reports/schedule-inspection', {
    method: 'POST',
    body: JSON.stringify({ reportId, date }),
  });
};

export const uploadInspectionVerification = (formData) => {
  return request('/citizen-reports/upload-verification', {
    method: 'POST',
    body: formData,
  });
};

export const resolveComplaint = (reportId, decision, resolutionSummary) => {
  return request('/citizen-reports/resolve', {
    method: 'POST',
    body: JSON.stringify({ reportId, decision, resolutionSummary }),
  });
};

export const getMyRewards = () => request('/rewards/my-rewards');

export const getInspectors = () => request('/auth/inspectors');
