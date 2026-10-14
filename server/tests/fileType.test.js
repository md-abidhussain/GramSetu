import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { detectFileType, isAllowedType, IMAGE_TYPES, PDF_TYPES } from '../utils/fileType.js';

const bytes = (...values) => Buffer.from(values);
const jpeg = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10);
const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00);
const gif = Buffer.from('GIF89a and then data', 'latin1');
const webp = Buffer.concat([Buffer.from('RIFF', 'latin1'), bytes(0, 0, 0, 0), Buffer.from('WEBP', 'latin1')]);
const pdf = Buffer.from('%PDF-1.7\nstuff', 'latin1');
const windowsExecutable = Buffer.from('MZ\x90\x00this is a program', 'latin1');

describe('detectFileType', () => {
  test('recognises the formats the app accepts', () => {
    assert.equal(detectFileType(jpeg), 'image/jpeg');
    assert.equal(detectFileType(png), 'image/png');
    assert.equal(detectFileType(gif), 'image/gif');
    assert.equal(detectFileType(webp), 'image/webp');
    assert.equal(detectFileType(pdf), 'application/pdf');
  });

  test('returns null for anything else', () => {
    assert.equal(detectFileType(windowsExecutable), null);
    assert.equal(detectFileType(Buffer.from('<?php echo 1; ?>')), null);
    assert.equal(detectFileType(Buffer.alloc(0)), null);
    assert.equal(detectFileType('not a buffer'), null);
    assert.equal(detectFileType(undefined), null);
  });

  test('is not fooled by a file that is too short to carry the signature', () => {
    assert.equal(detectFileType(bytes(0xff, 0xd8)), null);
    assert.equal(detectFileType(Buffer.from('RIFF', 'latin1')), null);
  });
});

describe('isAllowedType', () => {
  test('accepts an image where an image is wanted', () => {
    assert.equal(isAllowedType(png, IMAGE_TYPES), true);
  });

  test('refuses a PDF where an image is wanted, and the other way round', () => {
    assert.equal(isAllowedType(pdf, IMAGE_TYPES), false);
    assert.equal(isAllowedType(png, PDF_TYPES), false);
  });

  test('refuses a program whatever it claims to be', () => {
    // An executable sent as image/png passes multer's filter, because the
    // filter can only read the content type the caller claims.
    assert.equal(isAllowedType(windowsExecutable, IMAGE_TYPES), false);
    assert.equal(isAllowedType(windowsExecutable, PDF_TYPES), false);
  });
});
