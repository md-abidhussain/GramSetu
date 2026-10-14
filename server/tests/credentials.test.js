import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  describePasswordProblem,
  isValidEmail,
  isValidPhone,
  toIdentifier,
  MINIMUM_PASSWORD_LENGTH
} from '../utils/credentials.js';

describe('toIdentifier', () => {
  test('keeps a plain string, without surrounding spaces', () => {
    assert.equal(toIdentifier('  abid@example.com '), 'abid@example.com');
  });

  test('turns a query operator into an empty string', () => {
    // This is the point of the function. A login body of
    // {"identifier": {"$ne": null}} must not reach Mongo as an operator.
    assert.equal(toIdentifier({ $ne: null }), '');
    assert.equal(toIdentifier({ $gt: '' }), '');
    assert.equal(toIdentifier(['admin@example.com']), '');
    assert.equal(toIdentifier({ toString: () => 'admin@example.com' }), '');
  });

  test('turns missing values into an empty string', () => {
    assert.equal(toIdentifier(undefined), '');
    assert.equal(toIdentifier(null), '');
    assert.equal(toIdentifier(true), '');
  });

  test('accepts a number, since a phone number may arrive as one', () => {
    assert.equal(toIdentifier(9876543210), '9876543210');
  });
});

describe('isValidEmail', () => {
  test('accepts ordinary addresses', () => {
    for (const email of ['abid@example.com', 'a.b+tag@sub.domain.co.in', 'officer@gramsetu.gov']) {
      assert.equal(isValidEmail(email), true, email);
    }
  });

  test('rejects what is not an address', () => {
    for (const email of ['', 'abid', 'abid@', '@example.com', 'abid@example', 'a b@example.com', 'two@@example.com']) {
      assert.equal(isValidEmail(email), false, JSON.stringify(email));
    }
  });

  test('rejects an object rather than reading properties off it', () => {
    assert.equal(isValidEmail({ $ne: null }), false);
  });
});

describe('isValidPhone', () => {
  test('accepts Indian mobile numbers, with or without the country code', () => {
    for (const phone of ['9876543210', '+919876543210', '919876543210', '98765 43210', '98765-43210']) {
      assert.equal(isValidPhone(phone), true, phone);
    }
  });

  test('rejects numbers that are not mobile numbers', () => {
    for (const phone of ['1234567890', '5876543210', '987654321', '98765432101', 'abcdefghij', '']) {
      assert.equal(isValidPhone(phone), false, JSON.stringify(phone));
    }
  });
});

describe('describePasswordProblem', () => {
  test('accepts a password of the minimum length or more', () => {
    assert.equal(describePasswordProblem('a'.repeat(MINIMUM_PASSWORD_LENGTH)), null);
    assert.equal(describePasswordProblem('a long enough passphrase'), null);
  });

  test('rejects a short password and says how long it must be', () => {
    const problem = describePasswordProblem('abc');
    assert.match(problem, new RegExp(String(MINIMUM_PASSWORD_LENGTH)));
  });

  test('rejects a missing password', () => {
    for (const value of ['', undefined, null, 12345678, {}]) {
      assert.equal(typeof describePasswordProblem(value), 'string', JSON.stringify(value));
    }
  });

  test('rejects spaces only, which passes a length check but is not a password', () => {
    assert.equal(typeof describePasswordProblem('        '), 'string');
  });

  test('rejects an absurdly long password, which bcrypt would truncate anyway', () => {
    assert.equal(typeof describePasswordProblem('a'.repeat(5000)), 'string');
  });
});
