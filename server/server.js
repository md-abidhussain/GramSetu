import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Loads .env and exits if a required secret is missing. Must stay the first
// local import so later modules see the values.
import './config/env.js';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import tenderRoutes from './routes/tenderRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import citizenRoutes from './routes/citizenRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import contractorRoutes from './routes/contractorRoutes.js';

// Authority is checked to see whether the database is already seeded.
import Authority from './models/Authority.js';
import seedDatabase from './data/seedDatabase.js';

const app = express();

// Only these front-ends may call the API from a browser. Anything else is
// refused, so a random site cannot make authenticated calls on a user's behalf.
const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // No origin header means a same-origin or server-to-server call.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

// Caps request size so a huge payload cannot exhaust server memory.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Slows down password guessing on the login and registration routes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' }
});

// Submitting a report or a tender stores a file and calls a paid AI service,
// so each one costs real money. This caps how fast a single caller can spend it.
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'You have sent a lot of uploads in a short time. Please try again later.' },
  // Reading project and tender lists is cheap and public, so only count the
  // requests that actually store a file or call the AI.
  skip: (req) => req.method === 'GET'
});

// Database connection
await connectDB();


// Seeding is opt-in. Without this guard the server wiped every collection on
// each restart, which destroys real data on hosts that restart or sleep (Render).
//   SEED_DB unset / false -> never seeds (safe default for production)
//   SEED_DB=true          -> seeds only when the database is empty
//   SEED_DB=force         -> wipes and reseeds (deliberate demo reset only)
const seedMode = (process.env.SEED_DB || '').toLowerCase();
if (seedMode === 'force') {
  console.log('SEED_DB=force - wiping and reseeding the database.');
  await seedDatabase();
} else if (seedMode === 'true') {
  const alreadySeeded = await Authority.estimatedDocumentCount();
  if (alreadySeeded === 0) {
    console.log('Database is empty - running first-time seed.');
    await seedDatabase();
  } else {
    console.log('Database already has data - skipping seed.');
  }
} else {
  console.log('Seeding disabled. Set SEED_DB=true to seed an empty database.');
}

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tenders', uploadLimiter, tenderRoutes);
app.use('/api/projects', uploadLimiter, projectRoutes);
app.use('/api/citizen-reports', uploadLimiter, citizenRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/contractors', contractorRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'GramSetu AI Infrastructure Verification Platform API is running.' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in production/dev mode on port ${PORT}`);
});
