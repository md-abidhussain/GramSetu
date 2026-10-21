import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount what each test rendered, so screens do not pile up between tests.
afterEach(() => cleanup());
