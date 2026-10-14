import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateIdParam } from '../middleware/validateIdParam.js';

// Stands in for Express: records what the handler did instead of sending it.
const fakeResponse = () => {
  const sent = {};
  return {
    sent,
    status(code) {
      sent.code = code;
      return this;
    },
    json(body) {
      sent.body = body;
      return this;
    }
  };
};

const run = (middleware, params) => {
  const res = fakeResponse();
  let passedOn = false;
  middleware({ params }, res, () => {
    passedOn = true;
  });
  return { ...res.sent, passedOn };
};

describe('validateIdParam', () => {
  const middleware = validateIdParam();

  test('passes a well formed id through to the handler', () => {
    const result = run(middleware, { id: '507f1f77bcf86cd799439011' });
    assert.equal(result.passedOn, true);
    assert.equal(result.code, undefined);
  });

  test('answers 400 rather than letting the database throw a 500', () => {
    // A malformed id used to reach Mongoose, whose cast error surfaced as a
    // 500 and made a bad link look like a broken server.
    for (const id of ['not-an-id', '123', '', 'null', '507f1f77bcf86cd79943901']) {
      const result = run(middleware, { id });
      assert.equal(result.code, 400, `id ${JSON.stringify(id)}`);
      assert.equal(result.passedOn, false, `id ${JSON.stringify(id)} should not reach the handler`);
    }
  });

  test('explains the problem in words a citizen can read', () => {
    const result = run(middleware, { id: 'not-an-id' });
    assert.match(result.body.message, /does not point to anything/);
  });

  test('checks the named parameter, not always id', () => {
    const middlewareForProject = validateIdParam('projectId');
    assert.equal(run(middlewareForProject, { projectId: 'broken' }).code, 400);
    assert.equal(run(middlewareForProject, { projectId: '507f1f77bcf86cd799439011' }).passedOn, true);
  });

  test('refuses a missing parameter instead of passing undefined on', () => {
    assert.equal(run(middleware, {}).code, 400);
  });
});
