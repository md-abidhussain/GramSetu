import { request } from './api.js';

export const getDashboardSummary = () => request('/dashboard/summary');

export const getRiskAnalytics = () => request('/dashboard/risk-analytics');

export const getContractorLeaderboard = () => request('/dashboard/contractor-scores');

export const getDashboardComplaints = () => request('/dashboard/complaints');

export const getMapPlotData = () => request('/dashboard/map-data');

// Notifications
export const getNotifications = () => request('/notifications');

export const markNotificationAsRead = (id) => {
  return request(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
};
