import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

describe('Seed Data Integrity', () => {
  const seedFile = fs.readFileSync(new URL('../../data/seedDatabase.js', import.meta.url), 'utf8');

  test('no unrelated images (pizza, dog, sunset sky, conference people) in seed data', () => {
    // Unrelated photo IDs identified in audit
    const unrelatedPhotoIds = [
      'photo-1580582932707', // pizza
      'photo-1544982503',    // dog on couch / interior
      'photo-1545624446',    // sky and clouds
      'photo-1515162305285'  // conference people
    ];

    for (const photoId of unrelatedPhotoIds) {
      assert.equal(
        seedFile.includes(photoId),
        false,
        `seedDatabase.js should not contain unrelated photo: ${photoId}`
      );
    }
  });

  test('seedDatabase includes notification seeding for authority and citizen accounts', () => {
    assert.match(seedFile, /Notification\.insertMany\(/);
    assert.match(seedFile, /userModel:\s*'Authority'/);
    assert.match(seedFile, /userModel:\s*'Citizen'/);
  });

  test('all project image entries in projectsData use valid https URLs, relative paths, or null for unuploaded stages', () => {
    // Extract the projectsData array slice from seedDatabase.js
    const projectsDataSlice = seedFile.slice(seedFile.indexOf('const projectsData = ['), seedFile.indexOf('const projects = [];'));
    const imageMatches = [...projectsDataSlice.matchAll(/(beforeImageUrl|afterImageUrl):\s*([^,\n]+)/g)];
    assert.equal(imageMatches.length, 12, '6 projects should define 12 before/after image fields');

    for (const [, field, value] of imageMatches) {
      const trimmed = value.trim().replace(/['"]/g, '');
      if (trimmed !== 'null') {
        assert.ok(
          trimmed.startsWith('https://') || trimmed.startsWith('/'),
          `${field} must be a valid https URL or relative path, got: ${trimmed}`
        );
      }
    }
  });
});
