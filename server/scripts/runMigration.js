import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Project from '../models/Project.js';
import { logger } from '../utils/logger.js';
import { migrateSampleProjectImages } from '../migrations/migrateSampleProjectImages.js';

async function main() {
  logger.info('Starting sample project images migration...');
  await connectDB();
  const result = await migrateSampleProjectImages(Project, logger);
  logger.info('Migration finished', result);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Migration failed with fatal error', { error: err.message, stack: err.stack });
  process.exit(1);
});
