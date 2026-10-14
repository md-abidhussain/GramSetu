import test from 'node:test';
import assert from 'node:assert/strict';
import { quantifyDefects } from '../services/segmentationService.js';

const photo = {
  buffer: Buffer.from('not a real image'),
  mimetype: 'image/jpeg',
  originalname: 'pothole.jpg'
};

// Each test sets the environment it needs and puts it back afterwards, so the
// order the tests run in does not matter.
const withEnv = async (url, run) => {
  const previous = process.env.SEGMENTATION_SERVICE_URL;
  const previousFetch = globalThis.fetch;
  if (url === undefined) {
    delete process.env.SEGMENTATION_SERVICE_URL;
  } else {
    process.env.SEGMENTATION_SERVICE_URL = url;
  }
  try {
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.SEGMENTATION_SERVICE_URL;
    } else {
      process.env.SEGMENTATION_SERVICE_URL = previous;
    }
    globalThis.fetch = previousFetch;
  }
};

test('reports measurement as unavailable when the service is not configured', async () => {
  await withEnv(undefined, async () => {
    const result = await quantifyDefects(photo, 0.25);
    assert.equal(result.status, 'unavailable');
    assert.deepEqual(result.defects, []);
  });
});

test('never reports made-up measurements as completed', async () => {
  await withEnv(undefined, async () => {
    const result = await quantifyDefects(photo, 0.25);
    // A previous version filled in an empty result and marked it completed,
    // which told officials a measurement had been taken when none had.
    assert.notEqual(result.status, 'completed');
    assert.doesNotMatch(result.message, /simulated/i);
  });
});

test('asks for a reference scale instead of guessing one', async () => {
  await withEnv('http://localhost:8001', async () => {
    for (const scale of [undefined, '', 0, -2, 'wide']) {
      const result = await quantifyDefects(photo, scale);
      assert.equal(result.status, 'scale_missing', `scale ${JSON.stringify(scale)}`);
      assert.deepEqual(result.defects, []);
    }
  });
});

test('reports unavailable when the service refuses the request', async () => {
  await withEnv('http://localhost:8001', async () => {
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    const result = await quantifyDefects(photo, 0.25);
    assert.equal(result.status, 'unavailable');
  });
});

test('reports unavailable when the service cannot be reached', async () => {
  await withEnv('http://localhost:8001', async () => {
    globalThis.fetch = async () => {
      throw new Error('connect ECONNREFUSED');
    };
    const result = await quantifyDefects(photo, 0.25);
    assert.equal(result.status, 'unavailable');
    assert.deepEqual(result.defects, []);
  });
});

test('passes through the defects the service measured', async () => {
  await withEnv('http://localhost:8001/', async () => {
    let calledUrl;
    globalThis.fetch = async (url) => {
      calledUrl = url;
      return {
        ok: true,
        json: async () => ({ defects: [{ type: 'pothole', areaCm2: 240 }] })
      };
    };

    const result = await quantifyDefects(photo, 0.25);
    assert.equal(result.status, 'completed');
    assert.equal(result.defects.length, 1);
    assert.equal(result.defects[0].type, 'pothole');
    // The trailing slash in the configured URL must not produce a double slash.
    assert.equal(calledUrl, 'http://localhost:8001/segment');
  });
});

test('ignores a malformed defect list rather than passing it on', async () => {
  await withEnv('http://localhost:8001', async () => {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ defects: 'none' }) });
    const result = await quantifyDefects(photo, 0.25);
    assert.deepEqual(result.defects, []);
  });
});
