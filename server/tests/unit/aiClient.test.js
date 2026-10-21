import test, { afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AI_STATUS, __setGeminiTransportForTests, generateJson, isRetryable, stripCodeFence } from '../../services/ai/geminiClient.js';
import { checker, normalizeDefectTypes } from '../../services/ai/responseSchema.js';

process.env.NODE_ENV = 'test';
process.env.AI_RETRY_BASE_MS = '1';

const validateScore = (raw) => {
  const c = checker(raw);
  return c.result({ score: c.number('score', 0, 100) });
};

const script = (...steps) => {
  let calls = 0;
  __setGeminiTransportForTests(async () => {
    const step = steps[Math.min(calls, steps.length - 1)];
    calls += 1;
    if (step instanceof Error) throw step;
    return step;
  });
  return () => calls;
};

const httpError = (status) => Object.assign(new Error(`status ${status}`), { status });

afterEach(() => __setGeminiTransportForTests(null));

describe('generateJson', () => {
  test('without an API key it does not call anything and returns not_configured', async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await generateJson({ prompt: 'x', validate: validateScore });
    assert.equal(result.status, AI_STATUS.NOT_CONFIGURED);
    assert.equal(result.data, undefined);
  });

  test('returns validated data on success, including fenced JSON', async () => {
    script('```json\n{"score": 72}\n```');
    const result = await generateJson({ prompt: 'x', validate: validateScore });
    assert.equal(result.status, AI_STATUS.COMPLETED);
    assert.deepEqual(result.data, { score: 72 });
  });

  test('retries a transient failure and then succeeds', async () => {
    const calls = script(httpError(503), httpError(429), '{"score": 10}');
    const result = await generateJson({ prompt: 'x', validate: validateScore });
    assert.equal(result.status, AI_STATUS.COMPLETED);
    assert.equal(calls(), 3);
  });

  test('gives up after the retry budget, with NO data', async () => {
    const calls = script(httpError(503));
    const result = await generateJson({ prompt: 'x', validate: validateScore, retries: 2 });
    assert.equal(result.status, AI_STATUS.UNAVAILABLE);
    assert.equal(result.reason, 'provider_error');
    assert.equal(result.data, undefined);
    assert.equal(calls(), 3);
  });

  test('does not retry errors that will not change (bad key, bad request)', async () => {
    for (const status of [400, 401, 403, 404]) {
      const calls = script(httpError(status));
      const result = await generateJson({ prompt: 'x', validate: validateScore });
      assert.equal(result.status, AI_STATUS.UNAVAILABLE);
      assert.equal(calls(), 1, `status ${status}`);
    }
  });

  test('a timeout is reported as a timeout', async () => {
    __setGeminiTransportForTests(() => new Promise(() => {}));
    const result = await generateJson({ prompt: 'x', validate: validateScore, timeoutMs: 20, retries: 0 });
    assert.equal(result.status, AI_STATUS.UNAVAILABLE);
    assert.equal(result.reason, 'timeout');
  });

  test('malformed JSON and out-of-range values become invalid_response, never defaults', async () => {
    script('not json at all', '{"score": 140}', '{"score": "high"}');
    const result = await generateJson({ prompt: 'x', validate: validateScore });
    assert.equal(result.status, AI_STATUS.INVALID_RESPONSE);
    assert.equal(result.data, undefined);
  });
});

describe('helpers', () => {
  test('isRetryable', () => {
    assert.equal(isRetryable({ code: 'AI_TIMEOUT' }), true);
    assert.equal(isRetryable(httpError(500)), true);
    assert.equal(isRetryable(httpError(401)), false);
    assert.equal(isRetryable(new TypeError('fetch failed')), true);
  });

  test('stripCodeFence', () => {
    assert.equal(stripCodeFence('```\n{"a":1}\n```'), '{"a":1}');
    assert.equal(stripCodeFence(' {"a":1} '), '{"a":1}');
  });

  test('normalizeDefectTypes maps synonyms and drops unknowns and "none"', () => {
    assert.deepEqual(normalizeDefectTypes(['Potholes', 'open manhole', 'none', 'UFO', 7, 'crack', 'cracks']), ['pothole', 'open_manhole', 'crack']);
    assert.deepEqual(normalizeDefectTypes('pothole'), []);
  });

  test('checker rejects non-objects', () => {
    const c = checker([1, 2]);
    c.number('score', 0, 100);
    assert.equal(c.result({}).ok, false);
  });
});
