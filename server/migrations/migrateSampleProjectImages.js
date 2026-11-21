import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SAMPLE_PROJECT_IMAGE_MAP = {
  'PMGSY Rural Road Upgrade': {
    beforeImageUrl: '/test-assets/project-1-road-before.jpg',
    afterImageUrl: '/test-assets/project-1-road-after.jpg'
  },
  'Government School Renovation': {
    beforeImageUrl: '/test-assets/project-2-school-before.jpg',
    afterImageUrl: '/test-assets/project-2-school-after.jpg'
  },
  'Village Water Pipeline Network': {
    beforeImageUrl: '/test-assets/project-3-pipeline-before.jpg',
    afterImageUrl: '/test-assets/project-3-pipeline-after.jpg'
  },
  'Primary Health Centre Construction': {
    beforeImageUrl: '/test-assets/project-4-healthcentre-before.jpg',
    afterImageUrl: '/test-assets/project-4-healthcentre-after.jpg'
  },
  'Bridge Rehabilitation Project': {
    beforeImageUrl: '/test-assets/project-5-bridge-before.jpg',
    afterImageUrl: '/test-assets/project-5-bridge-after.jpg'
  },
  'Smart Drainage Pavement Upgrade': {
    beforeImageUrl: '/test-assets/project-6-drainage-before.jpg',
    afterImageUrl: '/test-assets/project-6-drainage-after.jpg'
  }
};

/**
 * Idempotent migration that updates ONLY beforeImageUrl and afterImageUrl
 * for the 6 seeded sample projects, matching on title and dataSource='sample'.
 * Never deletes records. Never modifies real/non-sample projects.
 * Creates an audit backup of targeted records prior to mutation.
 *
 * @param {import('mongoose').Model} ProjectModel
 * @param {object} [loggerInstance]
 * @returns {Promise<{ totalFound: number, updatedCount: number, backup: Array }>}
 */
export async function migrateSampleProjectImages(ProjectModel, loggerInstance = console) {
  const titles = Object.keys(SAMPLE_PROJECT_IMAGE_MAP);

  // 1. Find only the targeted sample projects (strictly matching dataSource: 'sample')
  const matchedProjects = await ProjectModel.find({
    dataSource: 'sample',
    title: { $in: titles }
  });

  if (!matchedProjects || matchedProjects.length === 0) {
    if (loggerInstance.info) {
      loggerInstance.info('migration: no sample projects found to migrate');
    }
    return { totalFound: 0, updatedCount: 0, backup: [] };
  }

  // 2. Export / backup snapshot of targeted records before modification
  const backup = matchedProjects.map((p) => ({
    _id: p._id.toString(),
    title: p.title,
    dataSource: p.dataSource,
    beforeImageUrl: p.beforeImageUrl,
    afterImageUrl: p.afterImageUrl,
    completionScore: p.completionScore,
    projectHealth: p.projectHealth,
    snapshotTimestamp: new Date().toISOString()
  }));

  // Safely persist backup snapshot to server/data/backups if directory can be written
  try {
    const backupDir = path.join(__dirname, '../data/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, `sample_projects_pre_migration_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8');
    if (loggerInstance.info) {
      loggerInstance.info('migration: pre-migration backup written', { backupPath, count: backup.length });
    }
  } catch (fsErr) {
    // Non-fatal if filesystem is read-only (e.g. serverless container)
    if (loggerInstance.warn) {
      loggerInstance.warn('migration: could not write local backup file; logged in memory', { error: fsErr.message });
    }
  }

  // 3. Perform idempotent update ONLY on beforeImageUrl and afterImageUrl
  let updatedCount = 0;
  for (const project of matchedProjects) {
    const targetImages = SAMPLE_PROJECT_IMAGE_MAP[project.title];
    if (!targetImages) continue;

    const needsUpdate =
      project.beforeImageUrl !== targetImages.beforeImageUrl ||
      project.afterImageUrl !== targetImages.afterImageUrl;

    if (needsUpdate) {
      await ProjectModel.updateOne(
        { _id: project._id, dataSource: 'sample' },
        {
          $set: {
            beforeImageUrl: targetImages.beforeImageUrl,
            afterImageUrl: targetImages.afterImageUrl
          }
        }
      );
      updatedCount += 1;
      if (loggerInstance.info) {
        loggerInstance.info('migration: updated project images', {
          title: project.title,
          from: { before: project.beforeImageUrl, after: project.afterImageUrl },
          to: targetImages
        });
      }
    }
  }

  if (loggerInstance.info) {
    loggerInstance.info('migration: sample project images migration complete', {
      totalFound: matchedProjects.length,
      updatedCount
    });
  }

  return { totalFound: matchedProjects.length, updatedCount, backup };
}

export default migrateSampleProjectImages;
