import test, { afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { detectDefects, parseScale, realDefects } from '../../services/segmentationService.js';

process.env.NODE_ENV = 'test';
const photo = { buffer: Buffer.from('jpeg bytes'), mimetype: 'image/jpeg', originalname: 'pothole.jpg' };
const realFetch = globalThis.fetch;

const respond = (status, body) => {
  globalThis.fetch = async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
};

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.SEGMENTATION_SERVICE_URL;
  delete process.env.SEGMENTATION_SERVICE_TOKEN;
});

const configure = () => { process.env.SEGMENTATION_SERVICE_URL = 'http://segmentation.test/'; };

describe('detectDefects', () => {
  test('not configured: says so and returns no defects', async () => {
    const result = await detectDefects(photo);
    assert.equal(result.status, 'not_configured');
    assert.deepEqual(result.defects, []);
  });

  test('real inference is "completed"', async () => {
    configure();
    respond(200, {
      inferenceMode: 'real_inference',
      modelTask: 'detect',
      defects: [{ type: 'pothole', confidence: 0.81, areaFractionOfImage: 0.04, boundingBoxPixels: { x: 1, y: 2, width: 3, height: 4 } }]
    });
    const result = await detectDefects(photo);
    assert.equal(result.status, 'completed');
    assert.equal(result.defects[0].confidence, 0.81);
    assert.equal(result.defects[0].simulated, false);
    assert.equal(result.defects[0].depth, null);
  });

  test('real inference with nothing found is completed with an empty list, not an error', async () => {
    configure();
    respond(200, { inferenceMode: 'real_inference', defects: [] });
    const result = await detectDefects(photo);
    assert.equal(result.status, 'completed');
    assert.deepEqual(result.defects, []);
    assert.match(result.message, /no defects/i);
  });

  test('demo output is "simulated", with confidence removed', async () => {
    configure();
    respond(200, { inferenceMode: 'demo_simulation', defects: [{ type: 'pothole', confidence: 0.88 }] });
    const result = await detectDefects(photo);
    assert.equal(result.status, 'simulated');
    assert.equal(result.defects[0].simulated, true);
    assert.equal(result.defects[0].confidence, null);
    assert.deepEqual(realDefects(result), [], 'simulated defects never count');
  });

  test('a reply that does not say how it was produced is not trusted', async () => {
    configure();
    respond(200, { status: 'completed', defects: [{ type: 'pothole', confidence: 0.9 }] });
    const result = await detectDefects(photo);
    assert.equal(result.status, 'unavailable');
    assert.deepEqual(result.defects, []);
  });

  test('model not loaded (503) is reported as such', async () => {
    configure();
    respond(503, { inferenceMode: 'model_unavailable' });
    assert.equal((await detectDefects(photo)).status, 'model_unavailable');
  });

  test('a server error or a network failure is "unavailable"', async () => {
    configure();
    respond(500, { detail: 'boom' });
    assert.equal((await detectDefects(photo)).status, 'unavailable');
    globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
    assert.equal((await detectDefects(photo)).status, 'unavailable');
  });

  test('defects with invalid confidence or unknown types are dropped', async () => {
    configure();
    respond(200, {
      inferenceMode: 'real_inference',
      defects: [
        { type: 'pothole', confidence: 1.7 },
        { type: 'alien_artifact', confidence: 0.9 },
        { type: 'Crack', confidence: 0.6 }
      ]
    });
    const result = await detectDefects(photo);
    assert.deepEqual(result.defects.map((defect) => defect.type), ['crack']);
  });

  test('sends the service token and only sends a scale when one was measured', async () => {
    configure();
    process.env.SEGMENTATION_SERVICE_TOKEN = 'shared-token';
    let seen;
    globalThis.fetch = async (url, options) => {
      seen = options;
      return new Response(JSON.stringify({ inferenceMode: 'real_inference', defects: [] }), { status: 200 });
    };
    await detectDefects(photo, null);
    assert.equal(seen.headers['X-Service-Token'], 'shared-token');
    assert.equal(seen.body.get('scale_cm_per_pixel'), null);
    await detectDefects(photo, 0.2);
    assert.equal(seen.body.get('scale_cm_per_pixel'), '0.2');
  });
});

describe('parseScale', () => {
  test('no scale is allowed and means "no physical sizes"', () => {
    for (const value of [undefined, null, '']) assert.deepEqual(parseScale(value), { ok: true, scale: null });
  });

  test('rejects zero, negatives, text and implausibly large values', () => {
    for (const value of [0, -1, 'wide', 50, Infinity]) assert.equal(parseScale(value).ok, false, String(value));
  });

  test('accepts a plausible measured scale', () => {
    assert.deepEqual(parseScale('0.25'), { ok: true, scale: 0.25 });
  });
});
