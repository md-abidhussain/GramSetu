import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { createExpensiveWriteLimiter, createGlobalLimiter } from './middleware/rateLimits.js';
import { requestLogger } from './utils/logger.js';
import { describeOptionalConfig } from './config/env.js';

import authRoutes from './routes/authRoutes.js';
import tenderRoutes from './routes/tenderRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import citizenRoutes from './routes/citizenRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import contractorRoutes from './routes/contractorRoutes.js';

export const parseAllowedOrigins = (value) => (value || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

/**
 * Builds the Express app without connecting to a database or listening on a
 * port, so tests can drive it with supertest. server.js does the I/O.
 */
export const createApp = () => {
  const app = express();
  const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_ORIGINS);

  // Behind Render (and Vercel's rewrite in front of it) the socket address is
  // the proxy's, not the user's. Without this, every visitor shares one rate
  // limit bucket. Set TRUST_PROXY to the number of proxies in front of the app.
  const proxyHops = Number(process.env.TRUST_PROXY);
  if (Number.isInteger(proxyHops) && proxyHops > 0) {
    app.set('trust proxy', proxyHops);
  }
  app.disable('x-powered-by');

  app.use(requestLogger);
  app.use(helmet());

  // CSRF defence, part 1 of 2: a browser always sends Origin on cross-site
  // writes, and an origin that is not ours is refused before any route runs.
  // Part 2 is the SameSite=Lax session cookie (controllers/authController.js).
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      const error = new Error('This website is not allowed to call the GramSetu API.');
      error.status = 403;
      return callback(error);
    },
    credentials: true
  }));

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  // Liveness: the process is up. Readiness: it can serve real traffic.
  app.get('/health/live', (req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', (req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    res.status(databaseReady ? 200 : 503).json({
      status: databaseReady ? 'ready' : 'not_ready',
      database: databaseReady ? 'connected' : 'disconnected',
      // Booleans only: which optional features are configured, never values.
      features: describeOptionalConfig()
    });
  });

  const apiLimiter = createGlobalLimiter();
  const expensiveWrites = createExpensiveWriteLimiter();
  app.use('/api', apiLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/tenders', expensiveWrites, tenderRoutes);
  app.use('/api/projects', expensiveWrites, projectRoutes);
  app.use('/api/citizen-reports', expensiveWrites, citizenRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/rewards', rewardRoutes);
  app.use('/api/contractors', contractorRoutes);

  app.get('/', (req, res) => {
    res.json({ message: 'GramSetu API is running.' });
  });

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
