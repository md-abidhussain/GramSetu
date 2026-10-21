import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Notifications go to officials or citizens; userModel says which collection.
  user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },
  userModel: { type: String, enum: ['Authority', 'Citizen'], default: 'Authority' },
  message: { type: String, required: true, maxlength: 500 },
  type: { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
