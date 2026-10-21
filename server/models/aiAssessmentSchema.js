import mongoose from 'mongoose';

// Recorded next to every AI-derived field, so anyone reading a score can see
// whether a model actually produced it, which model, when, and if not, why.
export const aiAssessmentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['completed', 'not_configured', 'unavailable', 'invalid_response', 'sample_data'],
    required: true
  },
  reason: { type: String },
  model: { type: String },
  assessedAt: { type: Date }
}, { _id: false });

export const DATA_SOURCES = ['live', 'sample'];
