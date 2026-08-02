import mongoose from 'mongoose';

const statusHistoryEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { type: String, default: 'system' },
  timestamp: { type: Date, default: Date.now },
  remarks: { type: String, default: '' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tender: { type: mongoose.Schema.Types.ObjectId, ref: 'Tender', required: true },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  beforeImageUrl: { type: String }, // Cloudinary URL
  afterImageUrl: { type: String },  // Cloudinary URL
  completionScore: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
  projectHealth: { type: String, enum: ['Healthy', 'At Risk', 'Failed'] },
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
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
