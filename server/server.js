import mongoose from 'mongoose';
import { findConfigProblems } from './config/env.js';
import { logger } from './utils/logger.js';

const problems = findConfigProblems();
if (problems.length > 0) {
  for (const problem of problems) logger.error('configuration problem', { problem });
  logger.error('Refusing to start. Copy .env.example to .env and fix the values above.');
  process.exit(1);
}

// Imported after validation so nothing reads half-configured settings.
const { default: connectDB } = await import('./config/db.js');
const { createApp } = await import('./app.js');
const { default: Authority } = await import('./models/Authority.js');
const { default: Project } = await import('./models/Project.js');
const { default: seedDatabase } = await import('./data/seedDatabase.js');
const { migrateSampleProjectImages } = await import('./migrations/migrateSampleProjectImages.js');

await connectDB();

// Safe idempotent migration for sample project images
try {
  await migrateSampleProjectImages(Project, logger);
} catch (migErr) {
  logger.warn('migration: sample project images check encountered error', { error: migErr.message });
}

// Seeding is opt-in. It once ran on every boot and wiped every collection,
// which destroyed real data whenever the host restarted.
//   SEED_DB unset/false -> never; true -> only an empty database; force -> wipe and reseed
const seedMode = (process.env.SEED_DB || '').toLowerCase();
if (seedMode === 'force') {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_FORCE_SEED_IN_PRODUCTION !== 'true') {
    logger.error('SEED_DB=force is refused in production unless ALLOW_FORCE_SEED_IN_PRODUCTION=true.');
    process.exit(1);
  }
  logger.warn('SEED_DB=force: wiping and reseeding the database.');
  await seedDatabase();
} else if (seedMode === 'true') {
  if ((await Authority.estimatedDocumentCount()) === 0) {
    logger.info('Database is empty: running first-time seed.');
    await seedDatabase();
  } else {
    logger.info('Database already has data: skipping seed.');
  }
}

const app = createApp();
const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => {
  logger.info('server listening', { port, env: process.env.NODE_ENV || 'development' });
});

// Hosts send SIGTERM before replacing an instance. Stop taking new requests,
// let in-flight ones finish, then close the database connection.
let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('shutting down', { signal });
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  server.close(async () => {
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error('unhandled promise rejection', { reason }));
