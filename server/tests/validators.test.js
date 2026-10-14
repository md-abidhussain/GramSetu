import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidId,
  toLatitude,
  toLongitude,
  toText,
  toNumberInRange
} from '../utils/validators.js';

describe('toLatitude', () => {
  it('accepts the poles and everything between', () => {
    assert.equal(toLatitude(0), 0);
    assert.equal(toLatitude(90), 90);
    assert.equal(toLatitude(-90), -90);
    assert.equal(toLatitude('25.5941'), 25.5941);
  });

  it('rejects values past the poles', () => {
    assert.equal(toLatitude(90.0001), null);
    assert.equal(toLatitude(-90.0001), null);
  });

  it('rejects anything that is not a finite number', () => {
    // A latitude of "abc" used to become NaN and reach a database query.
    for (const bad of ['abc', '', null, undefined, {}, [], NaN, Infinity]) {
      assert.equal(toLatitude(bad), null, `expected ${String(bad)} to be rejected`);
    }
  });
});

describe('toLongitude', () => {
  it('accepts the full range', () => {
    assert.equal(toLongitude(180), 180);
    assert.equal(toLongitude(-180), -180);
  });

  it('rejects values past the antimeridian', () => {
    assert.equal(toLongitude(180.0001), null);
    assert.equal(toLongitude(-180.0001), null);
  });
});

describe('toText', () => {
  it('trims surrounding whitespace', () => {
    assert.equal(toText('  pothole  ', 50), 'pothole');
  });

  it('rejects text that is empty once trimmed', () => {
    assert.equal(toText('   ', 50), null);
    assert.equal(toText('', 50), null);
  });

  it('accepts text exactly at the limit and rejects one character more', () => {
    assert.equal(toText('a'.repeat(10), 10), 'a'.repeat(10));
    assert.equal(toText('a'.repeat(11), 10), null);
  });

  it('rejects values that are not strings', () => {
    for (const bad of [null, undefined, 42, {}, []]) {
      assert.equal(toText(bad, 50), null);
    }
  });
});

describe('toNumberInRange', () => {
  it('keeps a number that is already inside the range', () => {
    assert.equal(toNumberInRange(55, 0, 100, 100), 55);
  });

  it('clamps instead of rejecting, so a score cannot top the leaderboard', () => {
    assert.equal(toNumberInRange(9999, 0, 100, 100), 100);
    assert.equal(toNumberInRange(-500, 0, 100, 100), 0);
  });

  it('falls back when the value is not a number', () => {
    assert.equal(toNumberInRange('abc', 0, 100, 100), 100);
    assert.equal(toNumberInRange(undefined, 0, 100, 7), 7);
  });
});

describe('isValidId', () => {
  it('accepts a well formed object id', () => {
    assert.equal(isValidId('507f1f77bcf86cd799439011'), true);
  });

  it('rejects ids that would make the database driver throw', () => {
    for (const bad of ['abc123', '', null, undefined, '507f1f77bcf86cd79943901']) {
      assert.equal(isValidId(bad), false, `expected ${String(bad)} to be rejected`);
    }
  });
});
