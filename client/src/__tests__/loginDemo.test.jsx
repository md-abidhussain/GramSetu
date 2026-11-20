import React from 'react';
import { describe, expect, test, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import { mockApi } from './testUtils.jsx';

afterEach(() => vi.restoreAllMocks());

describe('LoginPage Demo Access', () => {
  test('renders demo access buttons with sample data badge', () => {
    mockApi({ 'GET /auth/me': { status: 401 } });
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Quick Demo Access')).toBeTruthy();
    expect(screen.getByText('Sample Data')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Demo Citizen/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Demo Official/i })).toBeTruthy();
  });

  test('clicking Demo Citizen logs in with demo citizen credentials', async () => {
    const calls = mockApi({
      'GET /auth/me': { status: 401 },
      'POST /auth/citizen/login': {
        body: {
          _id: 'cit-demo-1',
          name: 'Abhishek Maurya',
          email: 'citizen@gmail.com',
          role: 'citizen',
          isCitizen: true
        }
      }
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Demo Citizen/i }));

    await waitFor(() => {
      const loginCalls = calls.filter((c) => c.key.includes('/auth/citizen/login'));
      expect(loginCalls.length).toBe(1);
      expect(JSON.parse(loginCalls[0].init.body)).toEqual({
        identifier: 'citizen@gmail.com',
        password: 'citizen123'
      });
    });
  });

  test('clicking Demo Official logs in with demo official credentials', async () => {
    const calls = mockApi({
      'GET /auth/me': { status: 401 },
      'POST /auth/authority/login': {
        body: {
          _id: 'auth-demo-1',
          name: 'Dr. Ramesh Kumar',
          email: 'authority@gramsetu.gov',
          role: 'District Authority',
          isAuthority: true
        }
      }
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Demo Official/i }));

    await waitFor(() => {
      const loginCalls = calls.filter((c) => c.key.includes('/auth/authority/login'));
      expect(loginCalls.length).toBe(1);
      expect(JSON.parse(loginCalls[0].init.body)).toEqual({
        identifier: 'authority@gramsetu.gov',
        password: 'authority123'
      });
    });
  });
});
