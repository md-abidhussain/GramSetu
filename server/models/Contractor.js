import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationId: { type: String, required: true, unique: true },
  contactPerson: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  expertise: { type: String, default: '' },
  remarks: { type: String, default: '' },
  pastProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  performanceScore: { type: Number, default: 100, min: 0, max: 100 },
  completedOnTime: { type: Number, default: 0 },
  delayedCount: { type: Number, default: 0 },
  averageBudgetVariance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Contractor = mongoose.model('Contractor', contractorSchema);
export default Contractor;
