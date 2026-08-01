import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationId: { type: String, required: true, unique: true },
  pastProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  performanceScore: { type: Number, default: 100, min: 0, max: 100 },
  completedOnTime: { type: Number, default: 0 },
  delayedCount: { type: Number, default: 0 },
  averageBudgetVariance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Contractor = mongoose.model('Contractor', contractorSchema);
export default Contractor;
