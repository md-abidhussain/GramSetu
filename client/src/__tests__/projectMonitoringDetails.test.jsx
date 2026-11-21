import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectImage from '../components/ui/ProjectImage.jsx';
import { ProjectMonitoringPage } from '../pages/ProjectMonitoringPage.jsx';
import { mockApi, official, renderWithAuth } from './testUtils.jsx';

afterEach(() => vi.restoreAllMocks());

const mockProjects = [
  {
    _id: 'proj-1',
    title: 'PMGSY Rural Road Upgrade',
    description: 'Road overhaul and tar laying',
    budget: 4500000,
    contractor: { _id: 'cont-1', name: 'Purvanchal Roadways' },
    riskLevel: 'Low',
    location: { address: 'Rohaniya Block Link Rd, Varanasi, UP', lat: 25.3176, lng: 82.9739 },
    beforeImageUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?q=80&w=800',
    afterImageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800',
    completionScore: 92,
    projectHealth: 'Healthy',
    status: 'Verified',
    lifecycleStatus: 'Approved'
  },
  {
    _id: 'proj-2',
    title: 'Bridge Rehabilitation Project',
    description: 'Replacing girders and rebar layers',
    budget: 12500000,
    contractor: { _id: 'cont-2', name: 'Ganga Valley Construction' },
    riskLevel: 'Medium',
    location: { address: 'Ganga Canal PWD Bridge, Kanpur, UP', lat: 26.4499, lng: 80.3319 },
    beforeImageUrl: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?q=80&w=800',
    afterImageUrl: null,
    completionScore: null,
    projectHealth: 'Healthy',
    status: 'Pending',
    lifecycleStatus: 'Construction Started'
  }
];

describe('ProjectImage Component', () => {
  test('renders "Image not uploaded" placeholder when src is null or empty', () => {
    render(<ProjectImage src={null} alt="Test missing image" />);
    expect(screen.getByText('Image not uploaded')).toBeTruthy();
    expect(screen.getByText('No photographic proof registered')).toBeTruthy();
  });

  test('renders "Image not uploaded" placeholder when image load fails (onError)', () => {
    render(<ProjectImage src="https://example.com/broken-image.jpg" alt="Test broken image" />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByText('Image not uploaded')).toBeTruthy();
  });

  test('renders image link with zoom badge when valid src is provided', () => {
    render(<ProjectImage src="https://images.unsplash.com/photo-valid?q=80" alt="Valid road" />);
    const link = screen.getByRole('link', { name: /View full resolution image/ });
    expect(link).toBeTruthy();
    expect(screen.getByText('Zoom')).toBeTruthy();
  });
});

describe('ProjectMonitoringPage Details & Sync', () => {
  test('selects project by ?id= and renders that project details and images', async () => {
    mockApi({
      'GET /notifications': { body: [] },
      'GET /tenders': { body: [] },
      'GET /projects': { body: mockProjects },
      'GET /projects/proj-2/lifecycle': { body: { currentStatus: 'Construction Started', allowedNextStatuses: [], history: [] } }
    });

    renderWithAuth(<ProjectMonitoringPage />, { user: official, route: '/projects?id=proj-2' });

    expect(await screen.findAllByText('Bridge Rehabilitation Project')).toBeTruthy();
    expect(screen.getByText('Ganga Valley Construction')).toBeTruthy();
    expect(screen.getAllByText(/Ganga Canal PWD Bridge/).length).toBeGreaterThanOrEqual(1);

    // After image is null, so it must render the placeholder
    expect(screen.getByText('Image not uploaded')).toBeTruthy();
  });

  test('clicking a project from the list switches to that exact project', async () => {
    mockApi({
      'GET /notifications': { body: [] },
      'GET /tenders': { body: [] },
      'GET /projects': { body: mockProjects },
      'GET /projects/proj-1/lifecycle': { body: { currentStatus: 'Approved', allowedNextStatuses: [], history: [] } },
      'GET /projects/proj-2/lifecycle': { body: { currentStatus: 'Construction Started', allowedNextStatuses: [], history: [] } }
    });

    renderWithAuth(<ProjectMonitoringPage />, { user: official, route: '/projects' });

    // Defaults to first project (PMGSY Rural Road Upgrade)
    expect(await screen.findAllByText('PMGSY Rural Road Upgrade')).toBeTruthy();

    // Click second project in list
    const secondProjectItem = screen.getByText('Ganga Canal PWD Bridge, Kanpur, UP');
    fireEvent.click(secondProjectItem);

    // Header and contractor update to the second project
    expect(screen.getByText('Ganga Valley Construction')).toBeTruthy();
  });
});
