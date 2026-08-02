import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const authoritySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  uniqueUserId: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Government Officer', 'Inspector', 'District Authority', 'PWD Engineer', 'Admin'], 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

// Compare password method
authoritySchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const Authority = mongoose.model('Authority', authoritySchema);
export default Authority;
