const API_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

const REQUEST_TIMEOUT_MS = 90000;

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

  // The hosted backend sleeps when idle and can take close to a minute to
  // answer the first request. Without a ceiling a stalled request would hang
  // the screen indefinitely.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.message || `API error (status: ${response.status})`);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
