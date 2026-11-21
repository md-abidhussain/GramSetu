import bcrypt from 'bcryptjs';

import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';
import Contractor from '../models/Contractor.js';
import Project from '../models/Project.js';
import Tender from '../models/Tender.js';
import CitizenReport from '../models/CitizenReport.js';
import Reward from '../models/Reward.js';
import Notification from '../models/Notification.js';
import { logger } from '../utils/logger.js';

// The sample data the demo runs on: a handful of authorities, contractors,
// projects and tenders, plus the public demo logins. It is a few hundred lines
// of plain records, which is why it lives here instead of in server.js.
//
// This wipes every collection before writing, so server.js only calls it when
// SEED_DB says to. See the note there.
//
// Every seeded record is marked dataSource: 'sample' and the interface labels
// it as sample data. Seeded scores were written by hand: they are NOT AI
// results and are recorded with aiAssessment.status = 'sample_data'.
// Contractor names are fictional; earlier versions used real companies'
// names with invented performance scores.
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

    logger.info('seed: collections cleared');

    // 1. Seed Authorities
    const salt = await bcrypt.genSalt(12);
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

    await Authority.create({
      name: 'Er. Alok Sharma (PWD)',
      email: 'engineer@gramsetu.gov',
      uniqueUserId: 'AUTH-2026-3042',
      passwordHash: authorityPassword,
      role: 'PWD Engineer'
    });

    await Authority.create({
      name: 'Shri Vikram Dev (Chief Officer)',
      email: 'officer@gramsetu.gov',
      uniqueUserId: 'AUTH-2026-5542',
      passwordHash: authorityPassword,
      role: 'Government Officer'
    });

    // The Admin can create official accounts, so its password is never a
    // published demo value. It is only seeded when ADMIN_PASSWORD is set.
    if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12) {
      await Authority.create({
        name: 'System Admin',
        email: (process.env.ADMIN_EMAIL || 'admin@gramsetu.gov').toLowerCase(),
        uniqueUserId: 'AUTH-2026-0001',
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
        role: 'Admin'
      });
    } else {
      logger.warn('seed: ADMIN_PASSWORD not set (or under 12 characters), so no Admin account was created');
    }

    logger.info('seed: official demo accounts created');

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

    logger.info('seed: demo citizen account created');

    // 3. Seed Reward
    await Reward.create({
      citizen: demoCitizen._id,
      rewardType: 'Citizen Points',
      amount: 150,
      title: 'First Verification Bonus',
      description: 'Awarded 150 points for registering and completing first infrastructure audit verification.'
    });

    // 4. Seed Contractors
    const contractorData = [
      {
        name: 'Larsen & Toubro Construction (sample)',
        registrationId: 'SMP-LNT-2026-001',
        contactPerson: 'S. V. Desai (Head of Heavy Civil)',
        contactEmail: 'civil.infrastructure@larsentoubro.com',
        phone: '+91-22-6752-5656',
        address: 'L&T House, Ballard Estate, Mumbai, Maharashtra 400001',
        expertise: 'Expressways, PMGSY Highways & Heavy Civil Bridges',
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
        name: 'Afcons Infrastructure (sample)',
        registrationId: 'SMP-AFC-2026-002',
        contactPerson: 'K. Subrahmanian (Executive Vice Chairman)',
        contactEmail: 'tenders@afcons.com',
        phone: '+91-22-6719-1000',
        address: 'Afcons House, 16 Veera Desai Road, Andheri West, Mumbai 400053',
        expertise: 'Institutional Educational Campuses & Civil Structures',
        performanceScore: 88,
        trustScore: 88,
        completedCount: 29,
        delayedCount: 2,
        budgetOverrunsCount: 1,
        citizenComplaintsCount: 1,
        qualityIssuesCount: 1,
        performanceTrend: [82, 84, 86, 88],
        riskTrend: [20, 18, 16, 14],
        recentInspections: [
          { projectTitle: 'Government School Renovation', result: 'Verified - High Grade Finish' }
        ],
        aiSummary: 'Specializes in institutional campuses and structural civil works with consistent milestone delivery.'
      },
      {
        name: 'NCC Limited (sample)',
        registrationId: 'SMP-NCC-2026-003',
        contactPerson: 'A. A. V. Ranga Raju (Managing Director)',
        contactEmail: 'water.projects@nccltd.in',
        phone: '+91-40-2326-8888',
        address: 'NCC House, Madhapur, Hyderabad, Telangana 500081',
        expertise: 'Jal Jeevan Mission Piped Water Networks & WTPs',
        performanceScore: 92,
        trustScore: 92,
        completedCount: 35,
        delayedCount: 1,
        budgetOverrunsCount: 1,
        citizenComplaintsCount: 0,
        qualityIssuesCount: 1,
        performanceTrend: [85, 87, 89, 92],
        riskTrend: [18, 16, 14, 11],
        recentInspections: [
          { projectTitle: 'Village Water Pipeline Network', result: 'Verified - Perfect Alignment' }
        ],
        aiSummary: 'Highly qualified infrastructure developer specializing in heavy civil works, canal layouts, and water pipelines.'
      },
      {
        name: 'H.G. Infra Engineering (sample)',
        registrationId: 'SMP-HGI-2026-004',
        contactPerson: 'Harendra Singh (Chairman & MD)',
        contactEmail: 'contracts@hginfra.com',
        phone: '+91-141-410-6000',
        address: '14 Panchwati Colony, Ratanada, Jaipur, Rajasthan 342011',
        expertise: 'Primary Health Centres & Rural Medical Infrastructure',
        performanceScore: 74,
        trustScore: 74,
        completedCount: 18,
        delayedCount: 4,
        budgetOverrunsCount: 3,
        citizenComplaintsCount: 3,
        qualityIssuesCount: 3,
        performanceTrend: [85, 82, 78, 74],
        riskTrend: [12, 18, 22, 28],
        recentInspections: [
          { projectTitle: 'PHC Construction', result: 'Flagged - Foundation Hairline Cracks' }
        ],
        aiSummary: 'Under active monitoring for structural quality control and masonry crack mitigation at medical centre sites.'
      },
      {
        name: 'PNC Infratech (sample)',
        registrationId: 'SMP-PNC-2026-005',
        contactPerson: 'Pradeep Kumar Jain (Chairman & MD)',
        contactEmail: 'infra@pncinfratech.com',
        phone: '+91-562-405-4400',
        address: 'PNC Tower, 3/22-D Civil Lines, Bypass Road, Agra, UP 282002',
        expertise: 'Canal Bridges, Hydraulic Culverts & Heavy Concrete Structures',
        performanceScore: 90,
        trustScore: 90,
        completedCount: 24,
        delayedCount: 0,
        budgetOverrunsCount: 1,
        citizenComplaintsCount: 1,
        qualityIssuesCount: 1,
        performanceTrend: [83, 86, 88, 90],
        riskTrend: [16, 14, 15, 12],
        recentInspections: [
          { projectTitle: 'Bridge Rehabilitation Project', result: 'Verified - High Grade Rebar Used' }
        ],
        aiSummary: 'Specializes in highway overpasses and canal bridges with verified quality test records.'
      },
      {
        name: 'Dilip Buildcon (sample)',
        registrationId: 'SMP-DBL-2026-006',
        contactPerson: 'Dilip Suryavanshi (Managing Director)',
        contactEmail: 'corporate@dilipbuildcon.co.in',
        phone: '+91-755-402-9999',
        address: 'Plot No. 5, Inside Govind Narayan Gate, Chuna Bhatti, Bhopal, MP 462016',
        expertise: 'Precast Box Culverts & Smart Drainage Infrastructure',
        performanceScore: 85,
        trustScore: 86,
        completedCount: 31,
        delayedCount: 2,
        budgetOverrunsCount: 0,
        citizenComplaintsCount: 2,
        qualityIssuesCount: 1,
        performanceTrend: [82, 84, 85, 85],
        riskTrend: [20, 18, 19, 15],
        recentInspections: [
          { projectTitle: 'Smart Drainage Pavement Upgrade', result: 'Verified - Passed Water Logging test' }
        ],
        aiSummary: 'High capacity in mechanized precast drainage, road pavement overhauls, and urban storm water channels.'
      }
    ];

    const contractors = await Contractor.create(
      contractorData.map((contractor) => ({ ...contractor, baselineScore: contractor.performanceScore, dataSource: 'sample' }))
    );
    logger.info('seed: sample contractors created', { count: contractors.length });

    // 5. Seed Tenders and Projects
    const projectsData = [
      {
        title: 'PMGSY Rural Road Upgrade',
        description: 'Overhaul and tar laying for Rohaniya-Sector 3 connecting road under PM Gram Sadak Yojana.',
        budget: 4500000,
        contractor: contractors[0]._id, // sample contractor
        riskLevel: 'Low',
        location: { lat: 25.3176, lng: 82.9739, address: 'Rohaniya Block Link Rd, Varanasi, UP' },
        beforeImageUrl: '/test-assets/project-1-road-before.jpg',
        afterImageUrl: '/test-assets/project-1-road-after.jpg',
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
        contractor: contractors[1]._id, // sample contractor
        riskLevel: 'Medium',
        location: { lat: 26.8467, lng: 80.9462, address: 'Vikas Nagar Central School, Lucknow, UP' },
        beforeImageUrl: '/test-assets/project-2-school-before.jpg',
        afterImageUrl: '/test-assets/project-2-school-after.jpg',
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
        contractor: contractors[2]._id, // sample contractor
        riskLevel: 'Low',
        location: { lat: 25.4358, lng: 81.8463, address: 'Phaphamau Water Works, Prayagraj, UP' },
        beforeImageUrl: '/test-assets/project-3-pipeline-before.jpg',
        afterImageUrl: '/test-assets/project-3-pipeline-after.jpg',
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
        contractor: contractors[3]._id, // sample contractor
        riskLevel: 'High',
        location: { lat: 26.7606, lng: 83.3731, address: 'Pipraich Main Health Centre, Gorakhpur, UP' },
        beforeImageUrl: '/test-assets/project-4-healthcentre-before.jpg',
        afterImageUrl: '/test-assets/project-4-healthcentre-after.jpg',
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
        contractor: contractors[4]._id, // sample contractor
        riskLevel: 'Low',
        location: { lat: 26.4499, lng: 80.3319, address: 'Ganga Canal PWD Bridge, Kanpur, UP' },
        beforeImageUrl: '/test-assets/project-5-bridge-before.jpg',
        afterImageUrl: '/test-assets/project-5-bridge-after.jpg',
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
        contractor: contractors[5]._id, // sample contractor
        riskLevel: 'Medium',
        location: { lat: 25.4484, lng: 78.5685, address: 'Civil Lines Road 4, Jhansi, UP' },
        beforeImageUrl: '/test-assets/project-6-drainage-before.jpg',
        afterImageUrl: '/test-assets/project-6-drainage-after.jpg',
        completionScore: null,
        projectHealth: 'Healthy',
        healthPercentage: 100,
        status: 'Pending',
        lifecycleStatus: 'Project Created'
      }
    ];

    const projects = [];
    for (const proj of projectsData) {
      // Create associated Tender
      const tender = await Tender.create({
        title: `${proj.title} Intake`,
        description: proj.description,
        budget: proj.budget,
        contractor: proj.contractor,
        riskLevel: proj.riskLevel,
        aiSummary: 'Sample tender record. No document was analysed.',
        aiAssessment: { status: 'sample_data' },
        dataSource: 'sample'
      });

      // Create Project
      const project = await Project.create({
        title: proj.title,
        tender: tender._id,
        contractor: proj.contractor,
        location: proj.location,
        beforeImageUrl: proj.beforeImageUrl,
        afterImageUrl: proj.afterImageUrl,
        completionScore: proj.completionScore,
        riskLevel: proj.completionScore === null ? null : proj.riskLevel,
        aiAssessment: proj.completionScore === null ? undefined : { status: 'sample_data' },
        aiComparisonNotes: proj.completionScore === null ? undefined : 'Sample data: this score was written by hand, not produced by AI.',
        dataSource: 'sample',
        projectHealth: proj.projectHealth,
        healthPercentage: proj.healthPercentage,
        status: proj.status,
        lifecycleStatus: proj.lifecycleStatus,
        statusHistory: [
          { status: 'Tender Published', remarks: 'Tender published to portal.' },
          { status: 'Project Created', remarks: 'Ledger entry initialized.' }
        ]
      });
      projects.push(project);
    }

    logger.info('seed: sample tenders and projects created');

    // 5. Seed Citizen Reports / Complaints linked to demoCitizen and projects
    await CitizenReport.create({
      citizen: demoCitizen._id,
      project: projects[0]._id, // PMGSY Rural Road Upgrade
      citizenImageUrl: '/test-assets/citizen-pothole.jpg',
      gps: { lat: 25.3176, lng: 82.9739 },
      description: 'Major road cracking and large pothole formed near the main junction of the road completed last week.',
      detectedIssues: ['crack', 'pothole'],
      aiReport: 'Sample data (written by hand, not AI): cracking and a pothole near the junction.',
      matchScore: 82,
      flaggedAsDiscrepancy: true,
      aiAssessment: { status: 'sample_data' },
      segmentation: {
        status: 'simulated',
        message: 'Sample data: no detection model was run on this photo.',
        defects: [
          { type: 'pothole', confidence: null, simulated: true, measurementBasis: 'bounding_box', areaFractionOfImage: 0.08, boundingBoxPixels: { x: 100, y: 150, width: 250, height: 66 } }
        ]
      },
      severity: 'High',
      severityBasis: ['sample_data'],
      dataSource: 'sample',
      status: 'Inspector Assigned',
      assignedOfficer: auth2._id, // Inspector Sanjay Singh
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });

    await CitizenReport.create({
      citizen: demoCitizen._id,
      project: projects[1]._id, // Solar Street Lighting Upgrade
      citizenImageUrl: '/test-assets/citizen-surface-cracking.jpg',
      gps: { lat: 25.3185, lng: 82.9782 },
      description: 'Severe surface cracking and pavement degradation observed along the newly upgraded corridor.',
      detectedIssues: ['crack'],
      aiReport: 'Sample data (written by hand, not AI): extensive alligator cracking along the corridor pavement.',
      matchScore: 90,
      flaggedAsDiscrepancy: true,
      aiAssessment: { status: 'sample_data' },
      segmentation: { status: 'not_configured', message: 'Sample data: no detection model was run on this photo.', defects: [] },
      severity: 'Medium',
      severityBasis: ['sample_data'],
      dataSource: 'sample',
      status: 'Inspector Assigned',
      assignedOfficer: auth2._id, // Inspector Sanjay Singh
      inspectionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Scheduled tomorrow
      resolutionEta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    });

    logger.info('seed: sample complaints created');

    // 6. Seed Sample Notifications for Demo Accounts
    await Notification.insertMany([
      {
        user: auth1._id,
        userModel: 'Authority',
        type: 'warning',
        message: 'Citizen report filed for PMGSY Rural Road Upgrade: crack and pothole detected.',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        user: auth1._id,
        userModel: 'Authority',
        type: 'info',
        message: 'Bridge Rehabilitation Project (Kanpur) tender published.',
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        user: auth1._id,
        userModel: 'Authority',
        type: 'success',
        message: 'AI verification completed for PMGSY Rural Road Upgrade (Completion score: 92%).',
        read: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
      },
      {
        user: auth2._id,
        userModel: 'Authority',
        type: 'info',
        message: 'You have been assigned to inspect complaint for Rohaniya Block Link Rd.',
        read: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        user: auth2._id,
        userModel: 'Authority',
        type: 'warning',
        message: 'Inspection scheduled tomorrow for Vikas Nagar Central School site.',
        read: false,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        user: demoCitizen._id,
        userModel: 'Citizen',
        type: 'info',
        message: 'An inspector has been assigned to your report for Rohaniya Block Link Rd.',
        read: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        user: demoCitizen._id,
        userModel: 'Citizen',
        type: 'success',
        message: 'Your report was verified by field inspection. 50 civic points awarded.',
        read: true,
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000)
      }
    ]);

    logger.info('seed: sample notifications created');

  } catch (error) {
    // A half-seeded database is worse than none: stop the server so it is noticed.
    logger.error('seed failed', { error: error.message });
    throw error;
  }
};
export default seedDatabase;
