import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary.jsx';

const Broken = () => {
  throw new Error('tender list exploded');
};

const Working = () => <p>normal content</p>;

// The boundary logs to the console on purpose, so the log is silenced here to
// keep the test output readable, and checked in its own test below.
let consoleError;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  // Unmount between tests. Testing Library only does this by itself when
  // vitest globals are switched on, and they are not.
  cleanup();
});

describe('ErrorBoundary', () => {
  it('shows the page normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Working />
      </ErrorBoundary>
    );

    expect(screen.getByText('normal content')).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('shows a message and a way out instead of a blank page', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByRole('button', { name: /reload the page/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /go to the start/i })).toBeTruthy();
  });

  it('records the failure so it is not silent', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );

    const logged = consoleError.mock.calls.some((call) =>
      String(call[0]).includes('A page failed to render.')
    );

    expect(logged).toBe(true);
  });

  it('shows the error message while developing', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );

    expect(screen.getByText('tender list exploded')).toBeTruthy();
  });
});
