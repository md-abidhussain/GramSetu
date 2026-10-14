import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, isCitizenUser, makeIsCurrent, navItemsFor } from '../navItems.js';

describe('isCitizenUser', () => {
  it('recognises a citizen by either field the API may send', () => {
    expect(isCitizenUser({ role: 'citizen' })).toBe(true);
    expect(isCitizenUser({ isCitizen: true })).toBe(true);
  });

  it('does not treat an official or a signed out visitor as a citizen', () => {
    expect(isCitizenUser({ role: 'District Authority' })).toBe(false);
    expect(isCitizenUser(null)).toBe(false);
    expect(isCitizenUser(undefined)).toBe(false);
  });
});

describe('navItemsFor', () => {
  it('shows citizens only their own sections', () => {
    const names = navItemsFor({ role: 'citizen' }).map((item) => item.name);
    expect(names).toContain('New report');
    expect(names).not.toContain('Dashboard');
    expect(names).not.toContain('Tenders');
  });

  it('shows officials only the review sections', () => {
    const names = navItemsFor({ role: 'Inspector' }).map((item) => item.name);
    expect(names).toContain('Dashboard');
    expect(names).not.toContain('New report');
  });

  it('gives every item to exactly one audience', () => {
    // A missing or misspelt audience would quietly drop a link from both menus.
    for (const item of NAV_ITEMS) {
      expect(['citizen', 'official']).toContain(item.audience);
    }
  });

  it('leaves no menu empty, which is what made the sidebar look broken before', () => {
    expect(navItemsFor({ role: 'citizen' }).length).toBeGreaterThan(0);
    expect(navItemsFor({ role: 'Admin' }).length).toBeGreaterThan(0);
  });
});

describe('makeIsCurrent', () => {
  it('matches a plain path', () => {
    expect(makeIsCurrent('/dashboard')('/dashboard')).toBe(true);
    expect(makeIsCurrent('/dashboard')('/tenders')).toBe(false);
  });

  it('tells the citizen tabs apart, which share one route', () => {
    const isCurrent = makeIsCurrent('/verify?tab=rewards');
    expect(isCurrent('/verify?tab=rewards')).toBe(true);
    expect(isCurrent('/verify?tab=submit')).toBe(false);
  });

  it('treats bare /verify as the reporting tab, since that is what it renders', () => {
    expect(makeIsCurrent('/verify')('/verify?tab=submit')).toBe(true);
  });
});
