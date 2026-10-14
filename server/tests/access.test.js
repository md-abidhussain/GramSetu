import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { canViewReport, isAllowedDecision, ALLOWED_DECISIONS } from '../utils/access.js';

const citizen = (id) => ({ isCitizen: true, user: { _id: id } });
const official = (id) => ({ isCitizen: false, user: { _id: id } });

describe('canViewReport', () => {
  test('lets a citizen open their own complaint', () => {
    assert.equal(canViewReport(citizen('abc123'), { citizen: 'abc123' }), true);
  });

  test('refuses a citizen another citizen\'s complaint', () => {
    // Complaints carry a photo, a description and a home location, so reading
    // someone else's is the leak that matters most in this app.
    assert.equal(canViewReport(citizen('abc123'), { citizen: 'xyz789' }), false);
  });

  test('compares a populated citizen document, not just a raw id', () => {
    const report = { citizen: { _id: 'abc123', name: 'Someone' } };
    assert.equal(canViewReport(citizen('abc123'), report), true);
    assert.equal(canViewReport(citizen('other'), report), false);
  });

  test('treats ids as equal regardless of the type they arrive as', () => {
    // Mongoose hands back ObjectId instances; the request carries a string.
    const asObjectId = { toString: () => 'abc123' };
    assert.equal(canViewReport(citizen('abc123'), { citizen: asObjectId }), true);
  });

  test('lets an official open any complaint', () => {
    assert.equal(canViewReport(official('staff1'), { citizen: 'abc123' }), true);
  });

  test('refuses a citizen a complaint with no owner recorded', () => {
    // An unowned complaint must not become readable by everyone.
    assert.equal(canViewReport(citizen('abc123'), { citizen: null }), false);
    assert.equal(canViewReport(citizen('abc123'), {}), false);
  });

  test('refuses a citizen whose own id is missing', () => {
    assert.equal(canViewReport({ isCitizen: true, user: {} }, { citizen: 'abc123' }), false);
  });
});

describe('isAllowedDecision', () => {
  test('accepts the three decisions an official can make', () => {
    for (const decision of ALLOWED_DECISIONS) {
      assert.equal(isAllowedDecision(decision), true, decision);
    }
  });

  test('refuses a later lifecycle stage posted as a decision', () => {
    // Without this an official could skip inspection and publish a complaint
    // as resolved in one request.
    for (const stage of ['Published', 'Resolved', 'Inspection Scheduled', 'Authority Notification']) {
      assert.equal(isAllowedDecision(stage), false, stage);
    }
  });

  test('refuses empty, missing and wrongly typed values', () => {
    for (const value of ['', null, undefined, 0, {}, ['Accepted']]) {
      assert.equal(isAllowedDecision(value), false, JSON.stringify(value));
    }
  });

  test('is case sensitive, so a near miss is still refused', () => {
    assert.equal(isAllowedDecision('accepted'), false);
    assert.equal(isAllowedDecision('ACCEPTED'), false);
  });
});
