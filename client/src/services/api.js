const API_BASE = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` : '/api';

const REQUEST_TIMEOUT_MS = 90000;

export const SESSION_EXPIRED_EVENT = 'gramsetu:session-expired';

/** Absolute API URL for links the browser opens directly (PDF downloads). */
export const apiUrl = (endpoint) => `${API_BASE}${endpoint}`;

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * The only way the client talks to the API. The session lives in an HttpOnly
 * cookie that JavaScript cannot read; the browser attaches it. A 401 on any
 * call except the session check announces that the session has ended, so the
 * app can return to the sign-in page instead of showing stale screens.
 */
export const request = async (endpoint, options = {}) => {
  const headers = { ...options.headers };
  if (options.body !== undefined && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // The hosted backend sleeps when idle and can take close to a minute to
  // answer the first request. Without a ceiling a stalled request would hang.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(apiUrl(endpoint), {
      ...options,
      headers,
      // Same-origin in production (Vercel rewrites /api); "include" only matters
      // if VITE_API_BASE_URL points at another origin during development.
      credentials: import.meta.env.VITE_API_BASE_URL ? 'include' : 'same-origin',
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please try again.', 0);
    }
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/auth/me' && !endpoint.includes('/login')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(data.message || `The request failed (status ${response.status}).`, response.status, data);
  }

  return data;
};
