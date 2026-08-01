import { request } from './api.js';

export const submitCitizenReport = (formData) => {
  return request('/citizen-reports', {
    method: 'POST',
    body: formData, // Sending FormData with citizenImage, location, desc
  });
};

export const getCitizenReports = () => request('/citizen-reports');

export const updateReportStatus = (id, status) => {
  return request(`/citizen-reports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};
