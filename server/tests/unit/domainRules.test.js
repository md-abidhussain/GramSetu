import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { assessSeverity } from '../../utils/severity.js';
import { STEP_FROM, canApply, COMPLAINT_STATUS } from '../../utils/complaintWorkflow.js';
import { allowedManualSteps, canMoveManually } from '../../utils/projectLifecycle.js';
import { computeContractorScores } from '../../services/contractorScoreService.js';
import { distanceInMeters } from '../../utils/geo.js';
import { readPagination } from '../../utils/pagination.js';
import { PERMISSIONS } from '../../utils/roles.js';

describe('assessSeverity', () => {
  test('with no real evidence the answer is Unassessed, not Low', () => {
    assert.deepEqual(assessSeverity({ ai: { status: 'unavailable' }, segmentation: { status: 'not_configured' } }), { severity: 'Unassessed', basis: [] });
  });

  test('simulated detections are ignored', () => {
    const segmentation = { status: 'simulated', defects: [{ type: 'pothole', areaFractionOfImage: 0.9 }] };
    assert.equal(assessSeverity({ ai: null, segmentation }).severity, 'Unassessed');
  });

  test('AI issues raise severity', () => {
    assert.equal(assessSeverity({ ai: { status: 'completed', detectedIssues: [], flaggedAsDiscrepancy: false, matchScore: 95 } }).severity, 'Low');
    assert.equal(assessSeverity({ ai: { status: 'completed', detectedIssues: ['crack'], matchScore: 60 } }).severity, 'Medium');
    assert.equal(assessSeverity({ ai: { status: 'completed', detectedIssues: ['crack', 'pothole', 'garbage'] } }).severity, 'High');
  });

  test('the higher of the two sources wins', () => {
    const result = assessSeverity({
      ai: { status: 'completed', detectedIssues: [], matchScore: 90 },
      segmentation: { status: 'completed', defects: [{ type: 'pothole', areaFractionOfImage: 0.2 }] }
    });
    assert.equal(result.severity, 'High');
    assert.deepEqual(result.basis, ['ai_image_review', 'defect_detection']);
  });
});

describe('complaint workflow', () => {
  test('accepting is only possible after evidence', () => {
    assert.equal(canApply('accept', COMPLAINT_STATUS.SUBMITTED), false);
    assert.equal(canApply('accept', COMPLAINT_STATUS.EVIDENCE_UPLOADED), true);
  });

  test('nothing can be done to a published complaint', () => {
    for (const step of Object.keys(STEP_FROM)) assert.equal(canApply(step, COMPLAINT_STATUS.PUBLISHED), false, step);
  });
});

describe('project lifecycle', () => {
  test('AI steps cannot be chosen by hand from anywhere', () => {
    for (const from of ['Construction Started', 'Waiting for AI Verification', 'Project Created']) {
      assert.equal(canMoveManually(from, 'AI Verified'), false);
      assert.equal(canMoveManually(from, 'Waiting for AI Verification'), false);
    }
  });

  test('final states are final', () => {
    for (const state of ['Approved', 'Rejected', 'Maintenance Required']) assert.deepEqual(allowedManualSteps(state), []);
  });
});

describe('computeContractorScores', () => {
  test('only real AI scores count towards the average', () => {
    const scores = computeContractorScores({
      projects: [
        { aiAssessment: { status: 'completed' }, completionScore: 80 },
        { aiAssessment: { status: 'sample_data' }, completionScore: 10 },
        { completionScore: 5 }
      ],
      acceptedComplaintCount: 0,
      baselineScore: 50
    });
    assert.equal(scores.averageCompletion, 80);
    assert.equal(scores.performanceScore, 80);
  });

  test('falls back to the baseline and subtracts verified complaints', () => {
    const scores = computeContractorScores({ projects: [], acceptedComplaintCount: 2, baselineScore: 90 });
    assert.equal(scores.averageCompletion, null);
    assert.equal(scores.performanceScore, 74);
  });

  test('scores stay within 0 to 100', () => {
    const scores = computeContractorScores({ projects: [{ status: 'Flagged' }], acceptedComplaintCount: 50, baselineScore: 90 });
    assert.equal(scores.performanceScore, 0);
    assert.equal(scores.trustScore, 0);
  });
});

describe('small utilities', () => {
  test('distanceInMeters is about right for a known pair', () => {
    const meters = distanceInMeters({ lat: 25.3176, lng: 82.9739 }, { lat: 25.3176, lng: 82.9749 });
    assert.ok(meters > 95 && meters < 105, String(meters));
  });

  test('pagination is clamped', () => {
    assert.deepEqual(readPagination({ page: '-3', limit: '100000' }), { page: 1, limit: 200, skip: 0 });
    assert.deepEqual(readPagination({ page: '2', limit: '10' }), { page: 2, limit: 10, skip: 10 });
    assert.deepEqual(readPagination({ page: 'x', limit: { $gt: 1 } }), { page: 1, limit: 50, skip: 0 });
  });

  test('the official-registration permission is Admin only', () => {
    assert.deepEqual(PERMISSIONS.manageOfficials, ['Admin']);
    assert.ok(!PERMISSIONS.resolveComplaint.includes('Inspector'));
  });
});
