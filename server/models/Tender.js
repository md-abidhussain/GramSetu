import mongoose from 'mongoose';

const tenderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  fileUrl: { type: String }, // Cloudinary URL of the PDF
  extractedText: { type: String },
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
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  recommendation: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Tender = mongoose.model('Tender', tenderSchema);
export default Tender;
