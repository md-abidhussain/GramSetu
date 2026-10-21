import mongoose from 'mongoose';
import { aiAssessmentSchema, DATA_SOURCES } from './aiAssessmentSchema.js';

const statusHistoryEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { type: String, default: 'system' },
  timestamp: { type: Date, default: Date.now },
  remarks: { type: String, default: '' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  tender: { type: mongoose.Schema.Types.ObjectId, ref: 'Tender', required: true },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  beforeImageUrl: { type: String }, // Cloudinary URL
  afterImageUrl: { type: String },  // Cloudinary URL
  beforeImagePublicId: { type: String, select: false },
  afterImagePublicId: { type: String, select: false },
  // AI before/after comparison. completionScore, riskLevel and
  // aiComparisonNotes are set only when aiAssessment.status is "completed".
  aiAssessment: { type: aiAssessmentSchema },
  completionScore: { type: Number, min: 0, max: 100, default: null },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High', null], default: null },
  projectHealth: { type: String, enum: ['Healthy', 'At Risk', 'Failed'], default: 'Healthy' },
  healthPercentage: { type: Number, default: 100, min: 0, max: 100 },
  complaintCount: { type: Number, default: 0 },
  suggestedMaintenance: { type: Boolean, default: false },
  aiComparisonNotes: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Flagged'], 
    default: 'Pending' 
  },
  lifecycleStatus: {
    type: String,
    enum: [
      'Tender Published',
      'Project Created',
      'Construction Started',
      'Waiting for AI Verification',
      'AI Verified',
      'Citizen Verification',
      'Under Authority Review',
      'Approved',
      'Rejected',
      'Maintenance Required'
    ],
    default: 'Tender Published'
  },
  statusHistory: [statusHistoryEntrySchema],
  budgetVariance: { type: Number, default: 0 }, // Positive values represent overruns in currency
  timelineEndDate: { type: Date },
  verifiedComplaintCount: { type: Number, default: 0 },
  dataSource: { type: String, enum: DATA_SOURCES, default: 'live' },
  createdAt: { type: Date, default: Date.now }
});

projectSchema.index({ createdAt: -1 });
projectSchema.index({ contractor: 1 });
projectSchema.index({ tender: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
