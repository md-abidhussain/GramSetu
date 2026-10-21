import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProjectLifecycleSection from '../components/monitoring/ProjectLifecycleSection.jsx';
import { AppRoutes } from '../routes/AppRoutes.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { SESSION_EXPIRED_EVENT } from '../services/api.js';
import { citizen, mockApi, official, renderWithAuth } from './testUtils.jsx';

afterEach(() => vi.restoreAllMocks());

describe('ProjectLifecycleSection', () => {
  test('offers only the stages the server allows, never "AI Verified"', async () => {
    mockApi({ 'GET /projects/p1/lifecycle': { body: { currentStatus: 'Project Created', allowedNextStatuses: ['Construction Started'], history: [] } } });
    renderWithAuth(<ProjectLifecycleSection projectId="p1" project={{ lifecycleStatus: 'Project Created' }} />, { user: official });
    expect(await screen.findByRole('option', { name: 'Construction Started' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'AI Verified' })).toBeNull();
  });

  test('a project waiting for AI explains why and offers a retry', async () => {
    mockApi({ 'GET /projects/p1/lifecycle': { body: { currentStatus: 'Waiting for AI Verification', allowedNextStatuses: [], history: [] } } });
    renderWithAuth(
      <ProjectLifecycleSection projectId="p1" project={{ lifecycleStatus: 'Waiting for AI Verification', aiAssessment: { status: 'unavailable' } }} />,
      { user: official }
    );
    expect(await screen.findByRole('button', { name: /Retry AI comparison/ })).toBeTruthy();
    expect(screen.getByText(/cannot be marked/)).toBeTruthy();
  });

  test('citizens see the stages but no controls', async () => {
    mockApi({ 'GET /projects/p1/lifecycle': { body: { currentStatus: 'Project Created', allowedNextStatuses: [], history: [] } } });
    renderWithAuth(<ProjectLifecycleSection projectId="p1" project={{ lifecycleStatus: 'Project Created' }} />, { user: citizen });
    await screen.findByText('History');
    expect(screen.queryByLabelText('Move to')).toBeNull();
  });
});

const renderApp = (route, me) => {
  mockApi({ 'GET /auth/me': me ? { body: me } : { status: 401, body: {} }, 'GET /projects': { body: [] } });
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('route guards (the server enforces access; these keep the screens consistent)', () => {
  test('an anonymous visitor to the dashboard is sent to sign in', async () => {
    renderApp('/dashboard', null);
    expect(await screen.findByRole('tab', { name: 'Public' })).toBeTruthy();
  });

  test('when any call reports the session ended, the user is sent to sign in with a message', async () => {
    renderApp('/verify', citizen);
    await screen.findAllByText(/Asha/);
    await act(async () => { window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)); });
    expect(await screen.findByText(/Your session ended/)).toBeTruthy();
  });
});
