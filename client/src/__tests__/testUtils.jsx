import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../context/AuthContext.jsx';

/** Replaces fetch with a router: { 'GET /auth/me': {status, body} | (init) => ({status, body}) }. */
export const mockApi = (routes) => {
  const calls = [];
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const path = String(url).replace(/^.*\/api/, '');
    const key = `${(init.method || 'GET').toUpperCase()} ${path}`;
    calls.push({ key, init });
    const route = routes[key];
    if (!route) return new Response(JSON.stringify({ message: `no mock for ${key}` }), { status: 404 });
    const { status = 200, body = {} } = typeof route === 'function' ? await route(init) : route;
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  });
  return calls;
};

export const renderWithAuth = (ui, { user = null, route = '/' } = {}) =>
  render(
    <AuthContext.Provider value={{ user, loading: false, sessionExpired: false, logoutUser: vi.fn() }}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );

export const official = { _id: 'o1', name: 'Officer', role: 'District Authority', isAuthority: true };
export const citizen = { _id: 'c1', name: 'Asha', role: 'citizen', isCitizen: true };
