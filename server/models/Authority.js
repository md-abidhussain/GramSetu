import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const authoritySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  uniqueUserId: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Government Officer', 'Inspector', 'District Authority', 'PWD Engineer', 'Admin'], 
    required: true 
  },
  // Bumped on logout or password change; tokens carrying an older value are refused.
  tokenVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

authoritySchema.index({ role: 1 });

// Compare password method
authoritySchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const Authority = mongoose.model('Authority', authoritySchema);
export default Authority;
