const API_BASE = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` : '/api';

const REQUEST_TIMEOUT_MS = 90000;

export const SESSION_EXPIRED_EVENT = 'gramsetu:session-expired';

/** Absolute API URL for links the browser opens directly (PDF downloads). */
export const apiUrl = (endpoint) => `${API_BASE}${endpoint}`;

/**
 * Downloads a file (e.g. generated PDF audit report) via authenticated in-app fetch
 * and initiates a browser blob download. Falls back gracefully to window.open.
 */
export const downloadFileBlob = async (endpoint, fallbackFilename = 'report.pdf') => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(apiUrl(endpoint), {
      credentials: import.meta.env.VITE_API_BASE_URL ? 'include' : 'same-origin',
      signal: controller.signal
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new ApiError(err.message || `Download failed (${response.status})`, response.status, err);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fallbackFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('File download failed, attempting window.open fallback:', error);
    window.open(apiUrl(endpoint), '_blank', 'noopener');
  } finally {
    clearTimeout(timeout);
  }
};

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
 * Unrelated API failures (e.g. 400, 403, 404, 500) do not clear the session.
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
      // Same-origin in local / rewrite mode; 'include' when targeting a remote API base URL.
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
