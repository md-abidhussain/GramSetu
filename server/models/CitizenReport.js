import mongoose from 'mongoose';

const citizenReportSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
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
  referenceScaleCmPerPixel: { type: Number, min: 0 },
  segmentation: {
    status: { type: String, enum: ['completed'], required: true },
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
  status: { 
    type: String, 
    enum: ['New', 'Reviewed', 'Resolved'], 
    default: 'New' 
  },
  createdAt: { type: Date, default: Date.now }
});

const CitizenReport = mongoose.model('CitizenReport', citizenReportSchema);
export default CitizenReport;
