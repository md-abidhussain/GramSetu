import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { verifyImageContents, verifyPdfContents } from '../middleware/uploadMiddleware.js';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const pdf = Buffer.from('%PDF-1.7 report', 'latin1');
const executable = Buffer.from('MZ\x90\x00this is a program', 'latin1');

const run = (middleware, file) => {
  const outcome = { passedOn: false };
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
  middleware({ file }, res, () => {
    outcome.passedOn = true;
  });
  return outcome;
};

describe('verifyImageContents', () => {
  test('lets a real image through', () => {
    const result = run(verifyImageContents, { buffer: png, mimetype: 'image/png' });
    assert.equal(result.passedOn, true);
  });

  test('refuses a program that claims to be an image', () => {
    // multer's own filter reads the claimed content type, so this is the only
    // place the lie is caught.
    const result = run(verifyImageContents, { buffer: executable, mimetype: 'image/png' });
    assert.equal(result.code, 400);
    assert.equal(result.passedOn, false);
  });

  test('refuses a PDF sent to an image endpoint', () => {
    assert.equal(run(verifyImageContents, { buffer: pdf, mimetype: 'image/png' }).code, 400);
  });

  test('corrects the content type to what the file really is', () => {
    // Later stages hand this value to Cloudinary, so it should describe the
    // bytes rather than repeat the caller's claim.
    const file = { buffer: png, mimetype: 'image/jpeg' };
    run(verifyImageContents, file);
    assert.equal(file.mimetype, 'image/png');
  });

  test('does nothing when the request carried no file', () => {
    // Some endpoints accept an optional photo.
    const result = run(verifyImageContents, undefined);
    assert.equal(result.passedOn, true);
    assert.equal(result.code, undefined);
  });

  test('refuses an empty file', () => {
    assert.equal(run(verifyImageContents, { buffer: Buffer.alloc(0), mimetype: 'image/png' }).code, 400);
  });
});

describe('verifyPdfContents', () => {
  test('lets a real PDF through', () => {
    assert.equal(run(verifyPdfContents, { buffer: pdf, mimetype: 'application/pdf' }).passedOn, true);
  });

  test('refuses an image sent to the tender endpoint', () => {
    assert.equal(run(verifyPdfContents, { buffer: png, mimetype: 'application/pdf' }).code, 400);
  });
});
