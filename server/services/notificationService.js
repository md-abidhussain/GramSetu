import Authority from '../models/Authority.js';
import Notification from '../models/Notification.js';
import { logger } from '../utils/logger.js';

// Notifications are a convenience: failing to write one must never fail the
// action that triggered it, so errors are logged and swallowed.

export const notifyOfficials = async (message, { type = 'info', roles } = {}) => {
  try {
    const filter = roles ? { role: { $in: roles } } : {};
    const officials = await Authority.find(filter).select('_id').lean();
    if (officials.length === 0) return;
    await Notification.insertMany(
      officials.map((official) => ({ user: official._id, userModel: 'Authority', message: message.slice(0, 500), type }))
    );
  } catch (error) {
    logger.warn('could not create notifications', { error: error.message });
  }
};

export const notifyUser = async (userId, userModel, message, type = 'info') => {
  if (!userId) return;
  try {
    await Notification.create({ user: userId, userModel, message: message.slice(0, 500), type });
  } catch (error) {
    logger.warn('could not create notification', { error: error.message });
  }
};
