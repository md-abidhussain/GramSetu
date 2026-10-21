import { afterEach, describe, expect, test, vi } from 'vitest';
import { request, SESSION_EXPIRED_EVENT } from '../services/api.js';
import { mockApi } from './testUtils.jsx';

afterEach(() => vi.restoreAllMocks());

describe('request', () => {
  test('never sends an Authorization header (sessions are HttpOnly cookies)', async () => {
    const calls = mockApi({ 'GET /projects': { body: [] } });
    await request('/projects');
    expect(calls[0].init.headers.Authorization).toBeUndefined();
    expect(calls[0].init.credentials).toBe('same-origin');
  });

  test('a 401 announces that the session ended', async () => {
    mockApi({ 'GET /tenders': { status: 401, body: { message: 'Your session has expired.' } } });
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    await expect(request('/tenders')).rejects.toMatchObject({ status: 401, message: 'Your session has expired.' });
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  });

  test('the session check itself does not trigger the event', async () => {
    mockApi({ 'GET /auth/me': { status: 401 } });
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    await expect(request('/auth/me')).rejects.toBeTruthy();
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  });

  test('a network failure becomes a readable message', async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    await expect(request('/projects')).rejects.toThrow(/Could not reach the server/);
  });

  test('JSON content type is set for JSON bodies but not for file uploads', async () => {
    const calls = mockApi({ 'POST /a': { body: {} }, 'POST /b': { body: {} } });
    await request('/a', { method: 'POST', body: JSON.stringify({ x: 1 }) });
    await request('/b', { method: 'POST', body: new FormData() });
    expect(calls[0].init.headers['Content-Type']).toBe('application/json');
    expect(calls[1].init.headers['Content-Type']).toBeUndefined();
  });
});
