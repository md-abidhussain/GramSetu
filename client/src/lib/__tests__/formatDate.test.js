import { describe, it, expect } from 'vitest';
import { formatDate } from '../formatDate.js';

describe('formatDate', () => {
  it('shows a readable date', () => {
    // Midday UTC, so the day cannot slip either way with the test machine's zone.
    expect(formatDate('2026-03-14T12:00:00Z')).toMatch(/Mar/);
    expect(formatDate('2026-03-14T12:00:00Z')).toMatch(/2026/);
  });

  it('says TBD rather than "Invalid Date" when there is no date', () => {
    expect(formatDate(null)).toBe('TBD');
    expect(formatDate(undefined)).toBe('TBD');
    expect(formatDate('')).toBe('TBD');
  });
});
