import mongoose from 'mongoose';

const citizenReportSchema = new mongoose.Schema({
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen', required: false },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false },
  customProjectTitle: { type: String },
  citizenImageUrl: { type: String, required: true },
  gps: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  description: { type: String, required: true },
  detectedIssues: [{ 
    type: String, 
    enum: ['crack', 'pothole', 'road_damage', 'leakage', 'broken_infrastructure', 'garbage', 'none']
  }],
  referenceScaleCmPerPixel: { type: Number, min: 0, default: 0.25 },
  segmentation: {
    status: { type: String, enum: ['pending', 'completed', 'scale_missing', 'unavailable'], default: 'pending' },
    message: { type: String },
    defects: [{
      type: { type: String },
      confidence: { type: Number },
      maskAreaPixels: { type: Number },
      areaCm2: { type: Number },
      widthCm: { type: Number },
      heightCm: { type: Number },
      equivalentDiameterCm: { type: Number },
      boundingBoxPixels: { x: Number, y: Number, width: Number, height: Number },
      depth: { type: Number, default: null },
      depthNote: { type: String }
    }]
  },
  aiReport: { type: String },
  matchScore: { type: Number, min: 0, max: 100 },
  flaggedAsDiscrepancy: { type: Boolean, default: false },
  
  // Real GovTech Workflow Fields
  status: { 
    type: String, 
    enum: [
      'Complaint Submitted',
      'AI Analysis',
      'Duplicate Detected',
      'Severity Detected',
      'Geo Verification',
      'Authority Notification',
      'Inspector Assigned',
      'Inspection Scheduled',
      'Inspector Uploads Verification',
      'Gemini Analysis',
      'AI Agent Validation',
      'Accepted',
      'Rejected',
      'Need More Evidence',
      'Resolution Published'
    ], 
    default: 'Complaint Submitted' 
  },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  duplicateFound: { type: Boolean, default: false },
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Authority', default: null },
  inspectionDate: { type: Date, default: null },
  resolutionEta: { type: Date, default: null },
  inspectorBeforeImageUrl: { type: String, default: '' },
  inspectorAfterImageUrl: { type: String, default: '' },
  inspectorNotes: { type: String, default: '' },
  resolutionSummary: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const CitizenReport = mongoose.model('CitizenReport', citizenReportSchema);
export default CitizenReport;
