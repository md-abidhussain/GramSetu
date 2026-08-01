import mongoose from 'mongoose';

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
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
