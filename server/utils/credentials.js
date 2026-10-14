// Rules about what may be used as a login or a password. They are here, rather
// than spread through the auth controller, so each one can be tested on its own.

/**
 * Values arriving in a JSON body can be objects, and a Mongo query treats
 * `{ "$ne": null }` as an operator rather than a value. Forcing a string first
 * means a crafted body can only ever be searched for as text.
 */
export const toIdentifier = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
};

// Deliberately simple: one @, something either side, a dot in the domain.
// Anything stricter rejects addresses that are valid in practice.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => EMAIL_SHAPE.test(toIdentifier(value));

// Indian mobile numbers: ten digits starting 6 to 9, optionally with +91.
const PHONE_SHAPE = /^(?:\+?91)?[6-9]\d{9}$/;

export const isValidPhone = (value) => PHONE_SHAPE.test(toIdentifier(value).replace(/[\s-]/g, ''));

export const MINIMUM_PASSWORD_LENGTH = 8;

/**
 * Returns null when the password is acceptable, or a sentence explaining what
 * is wrong. Length is what actually protects an account, so that is the rule;
 * forced symbols push people towards "Password1!" and a sticky note.
 */
export const describePasswordProblem = (password) => {
  if (typeof password !== 'string' || password.length === 0) {
    return 'A password is required.';
  }
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 200) {
    // bcrypt only reads the first 72 bytes, and a huge value is just a way to
    // make the server do pointless work.
    return 'That password is too long.';
  }
  if (/^\s+$/.test(password)) {
    return 'A password cannot be only spaces.';
  }
  return null;
};
