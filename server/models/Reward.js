import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'Citizen', required: true },
  rewardType: { 
    type: String, 
    enum: [
      'Citizen Points', 
      'Digital Certificate', 
      'Civic Contribution Badge', 
      'Volunteer Score', 
      'Government Recognition', 
      'Future Opportunities'
    ],
    required: true 
  },
  amount: { type: Number, default: 0 },
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Reward = mongoose.model('Reward', rewardSchema);
export default Reward;
