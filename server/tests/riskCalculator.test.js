import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRiskLevel } from '../utils/riskCalculator.js';

describe('calculateRiskLevel', () => {
  it('names each band', () => {
    assert.equal(calculateRiskLevel(10), 'Low');
    assert.equal(calculateRiskLevel(55), 'Medium');
    assert.equal(calculateRiskLevel(85), 'High');
  });

  it('puts the boundary scores in the higher band', () => {
    assert.equal(calculateRiskLevel(39), 'Low');
    assert.equal(calculateRiskLevel(40), 'Medium');
    assert.equal(calculateRiskLevel(69), 'Medium');
    assert.equal(calculateRiskLevel(70), 'High');
  });

  it('handles the ends of the scale', () => {
    assert.equal(calculateRiskLevel(0), 'Low');
    assert.equal(calculateRiskLevel(100), 'High');
  });
});
