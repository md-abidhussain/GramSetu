const API_URL = '/api';

/**
 * Base fetch API helper
 * @param {string} endpoint - Relative API route (e.g. /auth/login)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response body
 */
export const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do NOT set Content-Type header if sending FormData (browser needs to set boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.message || `API error (status: ${response.status})`);
    }

    return data;
  } catch (error) {
    console.error(`Request failed at ${endpoint}:`, error);
    throw error;
  }
};
