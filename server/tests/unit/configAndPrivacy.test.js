import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test';
const { findConfigProblems } = await import('../../config/env.js');
const { stripImageMetadata } = await import('../../utils/stripImageMetadata.js');
const { normalizePhone } = await import('../../utils/credentials.js');
const { redact } = await import('../../utils/logger.js');

const good = { MONGODB_URI: 'mongodb://x', JWT_SECRET: 'a'.repeat(40) };

describe('findConfigProblems', () => {
  test('a complete config has no problems', () => {
    assert.deepEqual(findConfigProblems(good), []);
  });

  test('refuses the published example secret', () => {
    const problems = findConfigProblems({ ...good, JWT_SECRET: 'super_secure_jwt_token_secret_phrase' });
    assert.match(problems.join(), /published example/);
  });

  test('refuses short secrets and missing values', () => {
    assert.match(findConfigProblems({ ...good, JWT_SECRET: 'short' }).join(), /at least 32/);
    assert.equal(findConfigProblems({}).length, 2);
  });

  test('production needs CLIENT_ORIGINS', () => {
    assert.match(findConfigProblems({ ...good, NODE_ENV: 'production' }).join(), /CLIENT_ORIGINS/);
  });

  test('TRUST_PROXY must be a hop count', () => {
    assert.match(findConfigProblems({ ...good, TRUST_PROXY: 'true' }).join(), /TRUST_PROXY/);
    assert.deepEqual(findConfigProblems({ ...good, TRUST_PROXY: '1' }), []);
  });
});

describe('stripImageMetadata', () => {
  const segment = (marker, payload) => {
    const length = Buffer.alloc(2);
    length.writeUInt16BE(payload.length + 2);
    return Buffer.concat([Buffer.from([0xff, marker]), length, payload]);
  };

  test('removes EXIF (APP1) from a JPEG and keeps the image data', () => {
    const exif = segment(0xe1, Buffer.from('Exif\0\0GPS 25.3176N 82.9739E'));
    const quant = segment(0xdb, Buffer.from('quant-table'));
    const scan = Buffer.from([0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0xaa, 0xbb, 0xff, 0xd9]);
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), exif, quant, scan]);

    const cleaned = stripImageMetadata(jpeg, 'image/jpeg');
    assert.equal(cleaned.includes(Buffer.from('GPS')), false);
    assert.ok(cleaned.includes(Buffer.from('quant-table')));
    assert.ok(cleaned.includes(Buffer.from([0xaa, 0xbb])));
    assert.deepEqual([...cleaned.subarray(0, 2)], [0xff, 0xd8]);
  });

  test('leaves malformed input unchanged', () => {
    const odd = Buffer.from([0xff, 0xd8, 0x00, 0x01, 0x02]);
    assert.deepEqual(stripImageMetadata(odd, 'image/jpeg'), odd);
  });
});

describe('normalizePhone', () => {
  test('stores one form for the same number', () => {
    for (const value of ['9876543210', '+91 98765 43210', '91-9876543210']) assert.equal(normalizePhone(value), '9876543210');
    assert.equal(normalizePhone('12345'), '');
  });
});

describe('redact', () => {
  test('hides secrets in log fields', () => {
    const out = redact({ password: 'p', nested: { authorization: 'Bearer x', ok: 1 }, MONGODB_URI: 'mongodb://u:p@h' });
    assert.equal(out.password, '[redacted]');
    assert.equal(out.nested.authorization, '[redacted]');
    assert.equal(out.nested.ok, 1);
    assert.equal(out.MONGODB_URI, '[redacted]');
  });
});
