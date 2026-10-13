import { isValidId } from '../utils/validators.js';

// Runs before any handler whose path carries a database id. Without it a
// malformed id reached Mongoose, which threw a cast error and surfaced to the
// caller as a 500, implying the server broke rather than the link being wrong.
export const validateIdParam = (paramName = 'id') => (req, res, next) => {
  if (!isValidId(req.params[paramName])) {
    return res.status(400).json({ message: 'That link does not point to anything.' });
  }
  next();
};
