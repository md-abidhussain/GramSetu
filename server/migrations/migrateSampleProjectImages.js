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

  // 1. Find only the targeted sample projects (strictly matching dataSource: 'sample' or matching known titles)
  const sampleDocs = await ProjectModel.find({
    dataSource: 'sample',
    title: { $in: titles }
  });
  const matchedProjects = sampleDocs && sampleDocs.length > 0
    ? sampleDocs
    : await ProjectModel.find({ title: { $in: titles } });

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

export const SAMPLE_CONTRACTOR_UPDATES = [
  {
    nameMatch: 'Toubro',
    updates: {
      name: 'Larsen & Toubro Construction',
      registrationId: 'REG-LNT-INFRA-2024-MH',
      contactPerson: 'S. V. Desai (Head of Heavy Civil)',
      contactEmail: 'civil.infrastructure@larsentoubro.com',
      phone: '+91-22-6752-5656',
      address: 'L&T House, Ballard Estate, Mumbai, Maharashtra 400001',
      expertise: 'Expressways, PMGSY Highways & Heavy Civil Bridges',
      trustScore: 94,
      performanceScore: 94,
      baselineScore: 94,
      remarks: 'Grade-A National Infrastructure Contractor with ISO 9001:2015 certification. Executing PMGSY rural connectivity packages.'
    }
  },
  {
    nameMatch: 'Afcons',
    updates: {
      name: 'Afcons Infrastructure Limited',
      registrationId: 'REG-AFCONS-CIVIL-2023-MH',
      contactPerson: 'K. Subrahmanian (Executive Vice Chairman)',
      contactEmail: 'tenders@afcons.com',
      phone: '+91-22-6719-1000',
      address: 'Afcons House, 16 Veera Desai Road, Andheri West, Mumbai 400053',
      expertise: 'Institutional Educational Campuses & Civil Structures',
      trustScore: 88,
      performanceScore: 88,
      baselineScore: 88,
      remarks: 'Flagship civil construction arm of Shapoorji Pallonji Group. Specializes in structural rehabilitation and public institutions.'
    }
  },
  {
    nameMatch: 'NCC',
    updates: {
      name: 'NCC Limited (Nagarjuna Construction)',
      registrationId: 'REG-NCC-WATER-2024-TG',
      contactPerson: 'A. A. V. Ranga Raju (Managing Director)',
      contactEmail: 'water.projects@nccltd.in',
      phone: '+91-40-2326-8888',
      address: 'NCC House, Madhapur, Hyderabad, Telangana 500081',
      expertise: 'Jal Jeevan Mission Piped Water Networks & WTPs',
      trustScore: 92,
      performanceScore: 92,
      baselineScore: 92,
      remarks: 'National leader in bulk water transmission, rural piped drinking networks, and automated water treatment plants.'
    }
  },
  {
    nameMatch: 'H.G.',
    updates: {
      name: 'H.G. Infra Engineering Limited',
      registrationId: 'REG-HGINFRA-PWD-2022-RJ',
      contactPerson: 'Harendra Singh (Chairman & MD)',
      contactEmail: 'contracts@hginfra.com',
      phone: '+91-141-410-6000',
      address: '14 Panchwati Colony, Ratanada, Jaipur, Rajasthan 342011',
      expertise: 'Primary Health Centres & Rural Medical Infrastructure',
      trustScore: 74,
      performanceScore: 74,
      baselineScore: 74,
      remarks: 'Under monitoring review for masonry quality control at Pipraich PHC site. Foundation rectification under progress.'
    }
  },
  {
    nameMatch: 'PNC',
    updates: {
      name: 'PNC Infratech Limited',
      registrationId: 'REG-PNC-STRUCT-2023-UP',
      contactPerson: 'Pradeep Kumar Jain (Chairman & MD)',
      contactEmail: 'infra@pncinfratech.com',
      phone: '+91-562-405-4400',
      address: 'PNC Tower, 3/22-D Civil Lines, Bypass Road, Agra, UP 282002',
      expertise: 'Canal Bridges, Hydraulic Culverts & Heavy Concrete Structures',
      trustScore: 90,
      performanceScore: 90,
      baselineScore: 90,
      remarks: 'Reputed for timely execution of high-load hydraulic bridge rehabilitation along major irrigation canals.'
    }
  },
  {
    nameMatch: 'Dilip',
    updates: {
      name: 'Dilip Buildcon Limited',
      registrationId: 'REG-DBL-URBAN-2024-MP',
      contactPerson: 'Dilip Suryavanshi (Managing Director)',
      contactEmail: 'corporate@dilipbuildcon.co.in',
      phone: '+91-755-402-9999',
      address: 'Plot No. 5, Inside Govind Narayan Gate, Chuna Bhatti, Bhopal, MP 462016',
      expertise: 'Precast Box Culverts & Smart Drainage Infrastructure',
      trustScore: 85,
      performanceScore: 85,
      baselineScore: 85,
      remarks: 'Pioneers in mechanized urban drainage excavation, precast concrete stormwater drains, and permeable pavements.'
    }
  }
];

export async function migrateSampleContractors(ContractorModel, loggerInstance = console) {
  if (!ContractorModel) return { updatedCount: 0 };
  let updatedCount = 0;
  for (const item of SAMPLE_CONTRACTOR_UPDATES) {
    try {
      const existing = await ContractorModel.findOne({
        $or: [
          { name: { $regex: item.nameMatch, $options: 'i' } },
          { registrationId: item.updates.registrationId }
        ]
      });
      if (existing) {
        const needsUpdate =
          existing.contactEmail !== item.updates.contactEmail ||
          existing.phone !== item.updates.phone ||
          existing.address !== item.updates.address ||
          existing.expertise !== item.updates.expertise;
        if (needsUpdate) {
          await ContractorModel.updateOne(
            { _id: existing._id },
            { $set: { ...item.updates, dataSource: 'sample' } }
          );
          updatedCount += 1;
        }
      }
    } catch (e) {
      if (loggerInstance.warn) {
        loggerInstance.warn('migration: contractor update notice', { error: e.message });
      }
    }
  }
  return { updatedCount };
}

export default migrateSampleProjectImages;
