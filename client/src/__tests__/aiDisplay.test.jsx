import React from 'react';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiscrepancyReport from '../components/citizen/DiscrepancyReport.jsx';
import CompletionScoreCard from '../components/monitoring/CompletionScoreCard.jsx';
import RiskBadge from '../components/tender/RiskBadge.jsx';

const base = { description: 'x', severity: 'Medium', segmentation: { status: 'not_configured', defects: [] } };

describe('DiscrepancyReport never presents missing AI as a result', () => {
  test('AI unavailable: explains it and shows no score or findings', () => {
    render(<DiscrepancyReport result={{ ...base, severity: 'Unassessed', aiAssessment: { status: 'unavailable' }, matchScore: null }} />);
    expect(screen.getByText(/AI did not run/i)).toBeTruthy();
    expect(screen.queryByText(/\/ 100/)).toBeNull();
    expect(screen.queryByText(/Problems the AI saw/)).toBeNull();
    expect(screen.getByText('Unassessed')).toBeTruthy();
  });

  test('a real AI result shows its score and findings', () => {
    render(<DiscrepancyReport result={{ ...base, aiAssessment: { status: 'completed' }, matchScore: 40, detectedIssues: ['pothole'], flaggedAsDiscrepancy: true, aiReport: 'Visible pothole.' }} />);
    expect(screen.getByText('40')).toBeTruthy();
    expect(screen.getByText(/Pothole/)).toBeTruthy();
    expect(screen.getByText('Visible pothole.')).toBeTruthy();
  });

  test('simulated detection is labelled as a demo, with no confidence', () => {
    render(<DiscrepancyReport result={{ ...base, aiAssessment: { status: 'unavailable' }, segmentation: { status: 'simulated', defects: [{ type: 'pothole', confidence: null, simulated: true }] } }} />);
    expect(screen.getByText(/DEMO SIMULATION/)).toBeTruthy();
    expect(screen.queryByText(/model confidence/)).toBeNull();
  });

  test('real detection shows model confidence and says size and depth are not measured', () => {
    render(<DiscrepancyReport result={{ ...base, aiAssessment: { status: 'unavailable' }, segmentation: { status: 'completed', defects: [{ type: 'open_manhole', confidence: 0.71, areaFractionOfImage: 0.02 }] } }} />);
    expect(screen.getByText('Open manhole')).toBeTruthy();
    expect(screen.getByText(/71% model confidence/)).toBeTruthy();
    expect(screen.getByText(/size and depth are not measured/i)).toBeTruthy();
  });

  test('sample records are badged', () => {
    render(<DiscrepancyReport result={{ ...base, dataSource: 'sample', aiAssessment: { status: 'sample_data' } }} />);
    expect(screen.getByText('Sample data')).toBeTruthy();
    expect(screen.getByText(/not an AI result/i)).toBeTruthy();
  });
});

describe('scores and risk', () => {
  test('no AI comparison means "Not scored", never a number', () => {
    render(<CompletionScoreCard score={null} assessment={{ status: 'unavailable' }} />);
    expect(screen.getByText('Not scored')).toBeTruthy();
  });

  test('a real score is shown with its caveat', () => {
    render(<CompletionScoreCard score={86} status="Verified" assessment={{ status: 'completed' }} />);
    expect(screen.getByText('86')).toBeTruthy();
    expect(screen.getByText(/not an engineering inspection/)).toBeTruthy();
  });

  test('missing risk is "not assessed", not Low', () => {
    render(<RiskBadge level={null} />);
    expect(screen.getByText('Risk not assessed')).toBeTruthy();
  });
});
