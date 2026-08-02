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
import rewardRoutes from './routes/rewardRoutes.js';

// Model imports for seeding
import Authority from './models/Authority.js';
import Citizen from './models/Citizen.js';
import Contractor from './models/Contractor.js';
import Project from './models/Project.js';
import Tender from './models/Tender.js';
import CitizenReport from './models/CitizenReport.js';
import Reward from './models/Reward.js';
import Notification from './models/Notification.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
await connectDB();

// Database Seeding function (Phase 7 & Phase 12)
const seedDatabase = async () => {
  try {
    // Drop all old/fake collections for a clean setup
    await Authority.deleteMany({});
    await Citizen.deleteMany({});
    await Contractor.deleteMany({});
    await Project.deleteMany({});
    await Tender.deleteMany({});
    await CitizenReport.deleteMany({});
    await Reward.deleteMany({});
    await Notification.deleteMany({});

    console.log('Cleared database collections. Re-seeding realistic records...');

    // 1. Seed Authorities
    const salt = await bcrypt.genSalt(10);
    const authorityPassword = await bcrypt.hash('authority123', salt);
    const inspectorPassword = await bcrypt.hash('inspector123', salt);

    const auth1 = await Authority.create({
      name: 'Dr. Ramesh Kumar (District Magistrate)',
      email: 'authority@gramsetu.gov',
      uniqueUserId: 'AUTH-2026-9021',
      passwordHash: authorityPassword,
      role: 'District Authority'
    });

    const auth2 = await Authority.create({
      name: 'Inspector Sanjay Singh',
      email: 'inspector@gramsetu.gov',
      uniqueUserId: 'AUTH-2026-1044',
      passwordHash: inspectorPassword,
      role: 'Inspector'
    });

    const auth3 = await Authority.create({
      name: 'Er. Alok Sharma (PWD)',
      email: 'engineer@gramsetu.gov',
      uniqueUserId: 'AUTH-2026-3042',
      passwordHash: authorityPassword,
      role: 'PWD Engineer'
    });

    const auth4 = await Authority.create({
      name: 'Shri Vikram Dev (Chief Officer)',
      email: 'officer@gramsetu.gov',
      uniqueUserId: 'AUTH-2026-5542',
      passwordHash: authorityPassword,
      role: 'Government Officer'
    });

    const auth5 = await Authority.create({
      name: 'System Admin',
      email: 'admin@gramsetu.gov',
      uniqueUserId: 'AUTH-2026-0001',
      passwordHash: authorityPassword,
      role: 'Admin'
    });

    console.log('Seeded 5 official Authority accounts.');

    // 2. Seed Citizen
    const citizenPassword = await bcrypt.hash('citizen123', salt);
    const demoCitizen = await Citizen.create({
      name: 'Abhishek Maurya',
      email: 'citizen@gmail.com',
      phone: '9999999999',
      passwordHash: citizenPassword,
      points: 150,
      volunteerScore: 8,
      badges: ['Verified Contributor']
    });

    console.log('Seeded demo citizen account (email: citizen@gmail.com / phone: 9999999999 / pass: citizen123).');

    // 3. Seed Reward
    await Reward.create({
      citizen: demoCitizen._id,
      rewardType: 'Citizen Points',
      amount: 150,
      title: 'First Verification Bonus',
      description: 'Awarded 150 points for registering and completing first infrastructure audit verification.'
    });

    // 4. Seed Contractors (NCC, L&T, Afcons, KNR, HG, PNC)
    const contractorData = [
      {
        name: 'L&T Construction',
        registrationId: 'LNT-2026-001',
        performanceScore: 94,
        trustScore: 95,
        completedCount: 42,
        delayedCount: 1,
        budgetOverrunsCount: 0,
        citizenComplaintsCount: 0,
        qualityIssuesCount: 0,
        performanceTrend: [88, 90, 92, 94],
        riskTrend: [12, 10, 8, 5],
        recentInspections: [
          { projectTitle: 'Solar Street Lighting Upgrade', result: 'Verified - High Quality' },
          { projectTitle: 'PMGSY Rural Road Upgrade', result: 'Passed - Minor Wear' }
        ],
        aiSummary: 'Top-tier contractor with exceptional safety compliance, zero structural discrepancies, and excellent budget adherence.'
      },
      {
        name: 'NCC Limited',
        registrationId: 'NCC-2026-002',
        performanceScore: 84,
        trustScore: 82,
        completedCount: 29,
        delayedCount: 3,
        budgetOverrunsCount: 2,
        citizenComplaintsCount: 1,
        qualityIssuesCount: 2,
        performanceTrend: [79, 81, 80, 84],
        riskTrend: [24, 25, 23, 18],
        recentInspections: [
          { projectTitle: 'Government School Renovation', result: 'Verified - Minor Paint Spills' }
        ],
        aiSummary: 'Consistent contractor with reliable concrete work, though experiences occasional labor mobilization delays.'
      },
      {
        name: 'Afcons',
        registrationId: 'AFC-2026-003',
        performanceScore: 91,
        trustScore: 92,
        completedCount: 35,
        delayedCount: 1,
        budgetOverrunsCount: 1,
        citizenComplaintsCount: 0,
        qualityIssuesCount: 1,
        performanceTrend: [85, 87, 89, 91],
        riskTrend: [18, 16, 14, 11],
        recentInspections: [
          { projectTitle: 'Village Water Pipeline Network', result: 'Verified - Perfect Alignment' }
        ],
        aiSummary: 'Highly qualified infrastructure developer specializing in heavy civil works, canal layouts, and water pipelines.'
      },
      {
        name: 'KNR Construction',
        registrationId: 'KNR-2026-004',
        performanceScore: 78,
        trustScore: 75,
        completedCount: 18,
        delayedCount: 4,
        budgetOverrunsCount: 3,
        citizenComplaintsCount: 3,
        qualityIssuesCount: 3,
        performanceTrend: [85, 82, 80, 78],
        riskTrend: [12, 18, 22, 28],
        recentInspections: [
          { projectTitle: 'PHC Construction', result: 'Flagged - Foundation Hairline Cracks' }
        ],
        aiSummary: 'Exhibits average project execution quality. Marked by escalating citizen complaints regarding pavement thickness.'
      },
      {
        name: 'HG Infra',
        registrationId: 'HGI-2026-005',
        performanceScore: 89,
        trustScore: 90,
        completedCount: 24,
        delayedCount: 0,
        budgetOverrunsCount: 1,
        citizenComplaintsCount: 1,
        qualityIssuesCount: 1,
        performanceTrend: [83, 86, 88, 89],
        riskTrend: [16, 14, 15, 12],
        recentInspections: [
          { projectTitle: 'Bridge Rehabilitation Project', result: 'Verified - High Grade Rebar Used' }
        ],
        aiSummary: 'Specializes in highway overpasses and bridges. Displays strong performance with clean timeline records.'
      },
      {
        name: 'PNC Infratech',
        registrationId: 'PNC-2026-006',
        performanceScore: 86,
        trustScore: 88,
        completedCount: 31,
        delayedCount: 2,
        budgetOverrunsCount: 0,
        citizenComplaintsCount: 2,
        qualityIssuesCount: 1,
        performanceTrend: [82, 84, 85, 86],
        riskTrend: [20, 18, 19, 15],
        recentInspections: [
          { projectTitle: 'Smart Drainage Pavement Upgrade', result: 'Verified - Passed Water Logging test' }
        ],
        aiSummary: 'Solid execution capacity. Occasional localized complaints regarding sidewalk finishings.'
      }
    ];

    const contractors = await Contractor.create(contractorData);
    console.log(`Seeded ${contractors.length} premium contractors.`);

    // 5. Seed Tenders and Projects (Phase 7)
    const projectsData = [
      {
        title: 'PMGSY Rural Road Upgrade',
        description: 'Overhaul and tar laying for Rohaniya-Sector 3 connecting road under PM Gram Sadak Yojana.',
        budget: 4500000,
        contractor: contractors[0]._id, // L&T
        riskLevel: 'Low',
        location: { lat: 25.3176, lng: 82.9739, address: 'Rohaniya Block Link Rd, Varanasi, UP' },
        beforeImageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600',
        afterImageUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?q=80&w=600',
        completionScore: 92,
        projectHealth: 'Healthy',
        healthPercentage: 96,
        status: 'Verified',
        lifecycleStatus: 'Approved'
      },
      {
        title: 'Government School Renovation',
        description: 'Comprehensive painting, roof rebuilding, and toilet installations at Vikash Nagar High School.',
        budget: 2500000,
        contractor: contractors[1]._id, // NCC
        riskLevel: 'Medium',
        location: { lat: 26.8467, lng: 80.9462, address: 'Vikas Nagar Central School, Lucknow, UP' },
        beforeImageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=600',
        afterImageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=600',
        completionScore: 82,
        projectHealth: 'Healthy',
        healthPercentage: 85,
        status: 'Verified',
        lifecycleStatus: 'Approved'
      },
      {
        title: 'Village Water Pipeline Network',
        description: 'Connecting Phaphamau village households with clean drinking water pipeline grid.',
        budget: 1800000,
        contractor: contractors[2]._id, // Afcons
        riskLevel: 'Low',
        location: { lat: 25.4358, lng: 81.8463, address: 'Phaphamau Water Works, Prayagraj, UP' },
        beforeImageUrl: 'https://images.unsplash.com/photo-1542013936693-8848e5740a7a?q=80&w=600',
        afterImageUrl: 'https://images.unsplash.com/photo-1584267326895-d88985f71408?q=80&w=600',
        completionScore: 94,
        projectHealth: 'Healthy',
        healthPercentage: 98,
        status: 'Verified',
        lifecycleStatus: 'Approved'
      },
      {
        title: 'Primary Health Centre Construction',
        description: 'Setting up a new modular double-storey rural clinic and trauma room facility.',
        budget: 6000000,
        contractor: contractors[3]._id, // KNR
        riskLevel: 'High',
        location: { lat: 26.7606, lng: 83.3731, address: 'Pipraich Main Health Centre, Gorakhpur, UP' },
        beforeImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600',
        afterImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600',
        completionScore: 68,
        projectHealth: 'At Risk',
        healthPercentage: 64,
        status: 'Flagged',
        lifecycleStatus: 'Under Authority Review'
      },
      {
        title: 'Bridge Rehabilitation Project',
        description: 'Replacing girders and rebar layers on the old Ganga Canal concrete highway bypass.',
        budget: 12500000,
        contractor: contractors[4]._id, // HG Infra
        riskLevel: 'Low',
        location: { lat: 26.4499, lng: 80.3319, address: 'Ganga Canal PWD Bridge, Kanpur, UP' },
        beforeImageUrl: 'https://images.unsplash.com/photo-1545624446-43a9cc961631?q=80&w=600',
        afterImageUrl: null,
        completionScore: null,
        projectHealth: 'Healthy',
        healthPercentage: 100,
        status: 'Pending',
        lifecycleStatus: 'Construction Started'
      },
      {
        title: 'Smart Drainage Pavement Upgrade',
        description: 'Upgrading open storm drains to heavy-duty smart culverts and laying concrete side pavements.',
        budget: 3200000,
        contractor: contractors[5]._id, // PNC
        riskLevel: 'Medium',
        location: { lat: 25.4484, lng: 78.5685, address: 'Civil Lines Road 4, Jhansi, UP' },
        beforeImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600',
        afterImageUrl: null,
        completionScore: null,
        projectHealth: 'Healthy',
        healthPercentage: 100,
        status: 'Pending',
        lifecycleStatus: 'Project Created'
      }
    ];

    for (const proj of projectsData) {
      // Create associated Tender
      const tender = await Tender.create({
        title: `${proj.title} Intake`,
        description: proj.description,
        budget: proj.budget,
        contractor: proj.contractor,
        riskLevel: proj.riskLevel,
        status: proj.lifecycleStatus === 'Project Created' || proj.lifecycleStatus === 'Tender Published' ? 'Approved' : 'Completed'
      });

      // Create Project
      await Project.create({
        title: proj.title,
        tender: tender._id,
        contractor: proj.contractor,
        location: proj.location,
        beforeImageUrl: proj.beforeImageUrl,
        afterImageUrl: proj.afterImageUrl,
        completionScore: proj.completionScore,
        riskLevel: proj.riskLevel,
        projectHealth: proj.projectHealth,
        healthPercentage: proj.healthPercentage,
        status: proj.status,
        lifecycleStatus: proj.lifecycleStatus,
        statusHistory: [
          { status: 'Tender Published', remarks: 'Tender published to portal.' },
          { status: 'Project Created', remarks: 'Ledger entry initialized.' }
        ]
      });
    }

    console.log('Seeded 6 realistic Tenders and Projects.');

  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

// Run Seeding on startup
await seedDatabase();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/citizen-reports', citizenRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rewards', rewardRoutes);

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
