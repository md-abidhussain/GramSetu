import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ContractorManagementPage } from '../pages/ContractorManagementPage.jsx';
import { ContractorAnalysisPage } from '../pages/ContractorAnalysisPage.jsx';
import { mockApi, official, renderWithAuth } from './testUtils.jsx';

afterEach(() => vi.restoreAllMocks());

const mockContractors = [
  {
    _id: 'c101',
    name: 'Purvanchal Roadways Infra',
    registrationId: 'UP-PWD-2023-884',
    performanceScore: 92,
    contactEmail: 'contact@purvanchal.in',
    phone: '+91 94150 11223',
    address: 'Varanasi, UP',
    expertise: 'Roads & Highways'
  },
  {
    _id: 'c102',
    name: 'Ganga Valley Construction',
    registrationId: 'UP-PWD-2022-412',
    performanceScore: 84,
    contactEmail: 'office@gangavalley.in',
    phone: '+91 94150 44556',
    address: 'Kanpur, UP',
    expertise: 'Bridges & Culverts'
  }
];

const mockAnalysisC102 = {
  contractor: mockContractors[1],
  metrics: {
    totalProjects: 3,
    completedProjects: 2,
    aiAssessedProjects: 2,
    verifiedProjects: 2,
    flaggedProjects: 1,
    pendingProjects: 0,
    averageCompletionScore: 88,
    acceptedComplaints: 0,
    performanceScore: 84,
    trustScore: 84
  },
  history: [
    {
      _id: 'p201',
      title: 'Bridge Rehabilitation Project',
      status: 'Verified',
      lifecycleStatus: 'Approved',
      completionScore: 88,
      riskLevel: 'Low',
      createdAt: new Date().toISOString()
    }
  ],
  feedback: [],
  chartData: [
    { name: 'Verified', value: 2 },
    { name: 'Flagged', value: 1 },
    { name: 'Pending', value: 0 }
  ]
};

describe('Contractor Details & Navigation', () => {
  test('ContractorManagementPage renders cards with navigation links to contractor analysis', async () => {
    mockApi({
      'GET /notifications': { body: [] },
      'GET /contractors': { body: mockContractors }
    });

    renderWithAuth(<ContractorManagementPage />, { user: official, route: '/contractors' });

    expect(await screen.findByText('Purvanchal Roadways Infra')).toBeTruthy();
    expect(screen.getByText('Ganga Valley Construction')).toBeTruthy();

    const detailButtons = screen.getAllByText(/Details/);
    expect(detailButtons.length).toBe(2);
  });

  test('ContractorAnalysisPage reads ?id= and renders that specific contractor record', async () => {
    mockApi({
      'GET /notifications': { body: [] },
      'GET /contractors': { body: mockContractors },
      'GET /contractors/c102/analysis': { body: mockAnalysisC102 }
    });

    renderWithAuth(<ContractorAnalysisPage />, { user: official, route: '/contractors-analysis?id=c102' });

    // Should load Ganga Valley Construction details
    expect((await screen.findAllByText('Ganga Valley Construction')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/UP-PWD-2022-412/)).toBeTruthy();
    expect(screen.getByText(/Bridge Rehabilitation Project/)).toBeTruthy();
    expect(screen.getAllByText('84/100').length).toBeGreaterThanOrEqual(1);
  });
});
