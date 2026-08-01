import { request } from './api.js';

export const getProjects = () => request('/projects');

export const getProjectById = (id) => request(`/projects/${id}`);

export const createProject = (formData) => {
  return request('/projects', {
    method: 'POST',
    body: formData, // Sending FormData with 'beforeImage'
  });
};

export const completeProject = (id, formData) => {
  return request(`/projects/${id}/complete`, {
    method: 'PATCH',
    body: formData, // Sending FormData with 'afterImage'
  });
};
