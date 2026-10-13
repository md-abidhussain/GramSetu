import mongoose from 'mongoose';

// Rejects ids that are not real ObjectIds, so a malformed id returns a clear
// 400 instead of Mongoose throwing a cast error that surfaces as a 500.
export const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

// Returns the number only when it is a real, in-range coordinate. Without this
// a value like "abc" became NaN and was passed straight into a database query.
export const toLatitude = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= -90 && number <= 90 ? number : null;
};

export const toLongitude = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= -180 && number <= 180 ? number : null;
};

// Trims and enforces a maximum length so one request cannot store an essay.
export const toText = (value, maxLength) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
};
