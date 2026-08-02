import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const citizenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // Sparse unique to allow optional email
  phone: { type: String, unique: true, sparse: true }, // Sparse unique to allow optional phone
  passwordHash: { type: String, required: true },
  points: { type: Number, default: 0 },
  volunteerScore: { type: Number, default: 0 },
  badges: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Compare password method
citizenSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const Citizen = mongoose.model('Citizen', citizenSchema);
export default Citizen;
