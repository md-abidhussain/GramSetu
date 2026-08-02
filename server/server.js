import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import tenderRoutes from './routes/tenderRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import citizenRoutes from './routes/citizenRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import contractorRoutes from './routes/contractorRoutes.js';

// Model imports for seeding
import User from './models/User.js';
import Contractor from './models/Contractor.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
await connectDB();

// Database Seeding function
const seedDatabase = async () => {
  try {
    // 1. Seed Authority User
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('authority123', salt);

      await User.create({
        name: 'Official Admin',
        email: 'authority@gramsetu.gov',
        passwordHash,
        role: 'authority'
      });
      console.log('Seeded default authority user: authority@gramsetu.gov / authority123');
    }

    // 2. Seed Contractors
    const contractorCount = await Contractor.countDocuments();
    if (contractorCount === 0) {
      await Contractor.create([
        {
          name: 'Bharat Infrastructure Corp',
          registrationId: 'BIC-2026-091',
          performanceScore: 92,
          completedOnTime: 12,
          delayedCount: 1,
          averageBudgetVariance: 2.5
        },
        {
          name: 'Gram Vikas Builders',
          registrationId: 'GVB-2026-104',
          performanceScore: 78,
          completedOnTime: 6,
          delayedCount: 2,
          averageBudgetVariance: 8.1
        },
        {
          name: 'Hindustan Roads & Bridges',
          registrationId: 'HRB-2026-442',
          performanceScore: 95,
          completedOnTime: 18,
          delayedCount: 0,
          averageBudgetVariance: -1.2
        },
        {
          name: 'Apex Rural Engineering',
          registrationId: 'ARE-2026-883',
          performanceScore: 60,
          completedOnTime: 4,
          delayedCount: 3,
          averageBudgetVariance: 15.4
        }
      ]);
      console.log('Seeded initial contractors for dashboard demonstration.');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

// Run Seeding
await seedDatabase();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/citizen-reports', citizenRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
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
