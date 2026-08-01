import { request } from './api.js';

export const getTenders = () => request('/tenders');

export const getTenderById = (id) => request(`/tenders/${id}`);

export const createTender = (formData) => {
  return request('/tenders', {
    method: 'POST',
    body: formData, // Sending FormData with PDF file
  });
};
