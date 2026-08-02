import { request } from './api.js';

export const getContractors = () => request('/contractors');

export const createContractor = (payload) => request('/contractors', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const getContractorAnalysis = (id) => request(`/contractors/${id}/analysis`);
