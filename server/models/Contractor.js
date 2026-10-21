import mongoose from 'mongoose';

const recentInspectionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  projectTitle: { type: String, required: true },
  result: { type: String, required: true }
}, { _id: false });

const contractorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationId: { type: String, required: true, unique: true },
  contactPerson: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  expertise: { type: String, default: '' },
  remarks: { type: String, default: '' },
  pastProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  // Score an official entered at registration (e.g. from past records). Used
  // until real project evidence exists. See services/contractorScoreService.js.
  baselineScore: { type: Number, default: 100, min: 0, max: 100 },
  performanceScore: { type: Number, default: 100, min: 0, max: 100 },
  trustScore: { type: Number, default: 100, min: 0, max: 100 },
  completedCount: { type: Number, default: 0 },
  completedOnTime: { type: Number, default: 0 },
  delayedCount: { type: Number, default: 0 },
  budgetOverrunsCount: { type: Number, default: 0 },
  citizenComplaintsCount: { type: Number, default: 0 },
  qualityIssuesCount: { type: Number, default: 0 },
  performanceTrend: [{ type: Number }], // array of historical scores
  riskTrend: [{ type: Number }], // array of historical risk ratings (0-100)
  recentInspections: [recentInspectionSchema],
  aiSummary: { type: String, default: '' },
  dataSource: { type: String, enum: ['live', 'sample'], default: 'live' },
  createdAt: { type: Date, default: Date.now }
});

contractorSchema.index({ trustScore: -1 });

const Contractor = mongoose.model('Contractor', contractorSchema);
export default Contractor;
