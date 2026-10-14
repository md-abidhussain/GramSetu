import mongoose from 'mongoose';

// Rejects ids that are not real ObjectIds, so a malformed id returns a clear
// 400 instead of Mongoose throwing a cast error that surfaces as a 500.
export const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

// Returns the number only when it is a real, in-range coordinate.
//
// Number('') and Number(null) are both 0, which is a valid latitude, so an
// empty or missing coordinate would otherwise pass as a point in the Atlantic.
// Only a number, or a string with something in it, is considered.
const toCoordinate = (value, limit) => {
  if (typeof value === 'string' && value.trim() === '') return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
};

export const toLatitude = (value) => toCoordinate(value, 90);

export const toLongitude = (value) => toCoordinate(value, 180);

// Trims and enforces a maximum length so one request cannot store an essay.
export const toText = (value, maxLength) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
};

// Keeps a number inside the range the field is meant to hold. Scores arrived
// straight from the request body, so a contractor could be created with a
// performance score of 9999 and sit permanently at the top of the leaderboard.
export const toNumberInRange = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
};
