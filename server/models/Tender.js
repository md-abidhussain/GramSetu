import mongoose from 'mongoose';
import { aiAssessmentSchema, DATA_SOURCES } from './aiAssessmentSchema.js';

const tenderSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 300 },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  fileUrl: { type: String }, // Cloudinary URL of the PDF
  filePublicId: { type: String, select: false },
  // Large; loaded only when explicitly asked for.
  extractedText: { type: String, select: false },
  aiAssessment: { type: aiAssessmentSchema },
  aiSummary: { type: String },
  budgetAllocated: { type: String },
  budgetAnalysis: {
    flagged: { type: Boolean, default: false },
    reason: { type: String }
  },
  timelineStart: { type: Date },
  timelineEnd: { type: Date },
  timelineAnalysis: {
    flagged: { type: Boolean, default: false },
    reason: { type: String }
  },
  riskScore: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High', null], default: null },
  recommendation: { type: String },
  dataSource: { type: String, enum: DATA_SOURCES, default: 'live' },
  createdAt: { type: Date, default: Date.now }
});

tenderSchema.index({ createdAt: -1 });
tenderSchema.index({ contractor: 1 });

const Tender = mongoose.model('Tender', tenderSchema);
export default Tender;
