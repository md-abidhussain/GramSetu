const API_URL = '/api';

let inMemoryToken = null;

export const setInMemoryToken = (token) => {
  inMemoryToken = token;
};

/**
 * Base fetch API helper
 * @param {string} endpoint - Relative API route (e.g. /auth/login)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response body
 */
export const request = async (endpoint, options = {}) => {
  const headers = {
    ...options.headers,
  };

  // If in-memory token exists, pass it as backup (cookies will be sent automatically by the browser)
  if (inMemoryToken) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }

  // Include credentials (cookies) in same-origin requests
  options.credentials = 'same-origin';

  // Do NOT set Content-Type header if sending FormData
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
