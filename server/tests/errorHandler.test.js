import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import multer from 'multer';
import { errorHandler } from '../middleware/errorMiddleware.js';

const request = { method: 'POST', originalUrl: '/api/projects' };

const handle = (err) => {
  const outcome = {};
  const res = {
    status(code) {
      outcome.code = code;
      return this;
    },
    json(body) {
      outcome.body = body;
      return this;
    }
  };
  errorHandler(err, request, res, () => {});
  return outcome;
};

// The handler logs every error, which is correct but noisy in a test run.
let originalConsoleError;
beforeEach(() => {
  originalConsoleError = console.error;
  console.error = () => {};
});
afterEach(() => {
  console.error = originalConsoleError;
});

describe('errorHandler', () => {
  test('does not repeat an unexpected error back to the caller', () => {
    // This is the behaviour that matters: the message on an unexpected error
    // names connection strings, file paths and queries.
    const leak = new Error('connect ECONNREFUSED mongodb://admin:hunter2@10.0.0.4:27017');
    const result = handle(leak);
    assert.equal(result.code, 500);
    assert.doesNotMatch(result.body.message, /mongodb|hunter2|10\.0\.0\.4/);
  });

  test('still explains a file that was too large', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    const result = handle(err);
    assert.equal(result.code, 400);
    assert.match(result.body.message, /too large/i);
  });

  test('explains a rejected file type', () => {
    const result = handle(new Error('Invalid file type. Only PDF documents are allowed.'));
    assert.equal(result.code, 400);
    assert.match(result.body.message, /Only PDF/);
  });

  test('turns a bad id in a body into a 400, not a 500', () => {
    const err = new Error('Cast to ObjectId failed');
    err.name = 'CastError';
    assert.equal(handle(err).code, 400);
  });

  test('names the field that was already taken', () => {
    const err = new Error('duplicate');
    err.code = 11000;
    err.keyValue = { email: 'abid@example.com' };
    const result = handle(err);
    assert.equal(result.code, 400);
    assert.match(result.body.message, /email/);
  });

  test('passes through a message a route raised deliberately', () => {
    const err = new Error('This tender is already closed.');
    err.status = 409;
    const result = handle(err);
    assert.equal(result.code, 409);
    assert.equal(result.body.message, 'This tender is already closed.');
  });

  test('hides the message when a route raised a 500 itself', () => {
    const err = new Error('seed step 4 failed on collection authorities');
    err.status = 500;
    const result = handle(err);
    assert.equal(result.code, 500);
    assert.doesNotMatch(result.body.message, /seed step/);
  });

  test('reports a validation error field by field', () => {
    const err = new Error('validation');
    err.name = 'ValidationError';
    err.errors = { title: { message: 'Title is required' } };
    const result = handle(err);
    assert.equal(result.code, 400);
    assert.match(result.body.message, /Title is required/);
  });
});
