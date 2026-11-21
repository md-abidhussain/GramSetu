import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { migrateSampleProjectImages, SAMPLE_PROJECT_IMAGE_MAP } from '../../migrations/migrateSampleProjectImages.js';

describe('Sample Project Images Migration', () => {
  test('idempotently updates sample projects without modifying real projects or deleting documents', async () => {
    // In-memory mock Project collection
    const database = [
      {
        _id: 'proj-sample-1',
        title: 'PMGSY Rural Road Upgrade',
        dataSource: 'sample',
        beforeImageUrl: 'https://images.unsplash.com/photo-old-church',
        afterImageUrl: 'https://images.unsplash.com/photo-old-pizza',
        completionScore: 92
      },
      {
        _id: 'proj-sample-2',
        title: 'Bridge Rehabilitation Project',
        dataSource: 'sample',
        beforeImageUrl: null,
        afterImageUrl: null,
        completionScore: null
      },
      {
        _id: 'proj-real-3',
        title: 'PMGSY Rural Road Upgrade', // Same title, but real user data
        dataSource: 'real',
        beforeImageUrl: 'https://res.cloudinary.com/real-user-upload/road.jpg',
        afterImageUrl: 'https://res.cloudinary.com/real-user-upload/road-done.jpg',
        completionScore: 100
      }
    ];

    const mockProjectModel = {
      find: async (query) => {
        return database.filter((doc) => {
          if (query.dataSource && doc.dataSource !== query.dataSource) return false;
          if (query.title?.$in && !query.title.$in.includes(doc.title)) return false;
          return true;
        });
      },
      updateOne: async (query, update) => {
        const item = database.find(
          (doc) => doc._id === query._id && (query.dataSource ? doc.dataSource === query.dataSource : true)
        );
        if (item && update.$set) {
          Object.assign(item, update.$set);
        }
        return { modifiedCount: item ? 1 : 0 };
      }
    };

    const mockLogger = {
      info: () => {},
      warn: () => {},
      error: () => {}
    };

    // First run: should update the 2 sample projects
    const result1 = await migrateSampleProjectImages(mockProjectModel, mockLogger);
    assert.equal(result1.totalFound, 2);
    assert.equal(result1.updatedCount, 2);
    assert.equal(result1.backup.length, 2);

    // Verify sample project 1 updated
    const p1 = database.find((d) => d._id === 'proj-sample-1');
    assert.equal(p1.beforeImageUrl, SAMPLE_PROJECT_IMAGE_MAP['PMGSY Rural Road Upgrade'].beforeImageUrl);
    assert.equal(p1.afterImageUrl, SAMPLE_PROJECT_IMAGE_MAP['PMGSY Rural Road Upgrade'].afterImageUrl);
    assert.equal(p1.completionScore, 92, 'other fields remain intact');

    // Verify sample project 2 updated
    const p2 = database.find((d) => d._id === 'proj-sample-2');
    assert.equal(p2.beforeImageUrl, SAMPLE_PROJECT_IMAGE_MAP['Bridge Rehabilitation Project'].beforeImageUrl);
    assert.equal(p2.afterImageUrl, SAMPLE_PROJECT_IMAGE_MAP['Bridge Rehabilitation Project'].afterImageUrl);

    // Verify REAL project was NOT touched
    const pReal = database.find((d) => d._id === 'proj-real-3');
    assert.equal(pReal.beforeImageUrl, 'https://res.cloudinary.com/real-user-upload/road.jpg');
    assert.equal(pReal.afterImageUrl, 'https://res.cloudinary.com/real-user-upload/road-done.jpg');

    // Second run: idempotent, should update 0 projects
    const result2 = await migrateSampleProjectImages(mockProjectModel, mockLogger);
    assert.equal(result2.totalFound, 2);
    assert.equal(result2.updatedCount, 0, 'idempotent rerun does not rewrite already migrated records');
  });
});
