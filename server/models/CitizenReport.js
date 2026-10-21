import mongoose from 'mongoose';
import { aiAssessmentSchema, DATA_SOURCES } from './aiAssessmentSchema.js';
import { DEFECT_TYPES } from '../services/ai/responseSchema.js';

const defectSchema = new mongoose.Schema({
  type: { type: String },
  confidence: { type: Number, min: 0, max: 1, default: null },
  simulated: { type: Boolean, default: false },
  measurementBasis: { type: String, enum: ['mask', 'bounding_box'] },
  areaPixels: { type: Number },
  areaFractionOfImage: { type: Number, min: 0, max: 1 },
  // Only present when someone supplied a measured scale.
  areaCm2: { type: Number, default: null },
  widthCm: { type: Number, default: null },
  heightCm: { type: Number, default: null },
  boundingBoxPixels: { x: Number, y: Number, width: Number, height: Number },
  // Depth cannot be measured from one ordinary photo. Always null.
  depth: { type: Number, default: null }
}, { _id: false });

const citizenReportSchema = new mongoose.Schema({
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  customProjectTitle: { type: String, maxlength: 200 },
  citizenImageUrl: { type: String, required: true },
  citizenImagePublicId: { type: String, select: false },
  gps: {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 }
  },
  geoVerified: { type: Boolean, default: null },
  distanceFromProjectMeters: { type: Number, default: null },
  description: { type: String, required: true, maxlength: 2000 },

  // AI image review (Gemini). The fields below it are set only when status is "completed".
  aiAssessment: { type: aiAssessmentSchema },
  detectedIssues: [{ type: String, enum: [...DEFECT_TYPES, 'none'] }],
  aiReport: { type: String },
  matchScore: { type: Number, min: 0, max: 100, default: null },
  flaggedAsDiscrepancy: { type: Boolean, default: false },

  // Defect detection (YOLO service). See services/segmentationService.js for statuses.
  referenceScaleCmPerPixel: { type: Number, min: 0, default: null },
  segmentation: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'simulated', 'model_unavailable', 'not_configured', 'unavailable', 'scale_missing'],
      default: 'pending'
    },
    message: { type: String },
    modelTask: { type: String },
    scaleCmPerPixel: { type: Number, default: null },
    defects: [defectSchema]
  },

  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Unassessed'], default: 'Unassessed' },
  severityBasis: [{ type: String }],

  status: {
    type: String,
    // Older records may hold the legacy intermediate stages; new code never writes them.
    enum: [
      'Complaint Submitted', 'AI Analysis', 'Duplicate Detected', 'Severity Detected', 'Geo Verification',
      'Authority Notification', 'Inspector Assigned', 'Inspection Scheduled', 'Inspector Uploads Verification',
      'Gemini Analysis', 'AI Agent Validation', 'Accepted', 'Rejected', 'Need More Evidence', 'Resolution Published'
    ],
    default: 'Authority Notification'
  },
  duplicateFound: { type: Boolean, default: false },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'CitizenReport', default: null },
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Authority', default: null },
  inspectionDate: { type: Date, default: null },
  resolutionEta: { type: Date, default: null },
  inspectorBeforeImageUrl: { type: String, default: '' },
  inspectorAfterImageUrl: { type: String, default: '' },
  inspectorImagePublicId: { type: String, select: false },
  inspectorNotes: { type: String, default: '', maxlength: 2000 },
  repairAssessment: {
    type: new mongoose.Schema({
      status: { type: String },
      reason: { type: String },
      model: { type: String },
      assessedAt: { type: Date },
      repairVisible: { type: Boolean },
      notes: { type: String }
    }, { _id: false })
  },
  resolutionSummary: { type: String, default: '', maxlength: 2000 },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Authority', default: null },
  decidedAt: { type: Date, default: null },
  rewardGranted: { type: Boolean, default: false },
  dataSource: { type: String, enum: DATA_SOURCES, default: 'live' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: false, updatedAt: true } });

// Each index matches a real query: a citizen's own list, an inspector's queue,
// the dashboard list (newest first), the per-project lookup used by contractor
// scoring, and the nearby-duplicate check.
citizenReportSchema.index({ citizen: 1, createdAt: -1 });
citizenReportSchema.index({ assignedOfficer: 1, status: 1 });
citizenReportSchema.index({ createdAt: -1 });
citizenReportSchema.index({ project: 1 });
citizenReportSchema.index({ status: 1, 'gps.lat': 1, 'gps.lng': 1 });

const CitizenReport = mongoose.model('CitizenReport', citizenReportSchema);
export default CitizenReport;
