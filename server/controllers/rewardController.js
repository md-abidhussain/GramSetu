import Reward from '../models/Reward.js';

export const getMyRewards = async (req, res, next) => {
  try {
    // req.user._id is loaded from the protectCitizen middleware
    const rewards = await Reward.find({ citizen: req.user._id }).sort({ createdAt: -1 });
    res.json(rewards);
  } catch (error) {
    next(error);
  }
};
