import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// JSDOM does not implement ResizeObserver used by responsive charts
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Unmount what each test rendered, so screens do not pile up between tests.
afterEach(() => cleanup());
