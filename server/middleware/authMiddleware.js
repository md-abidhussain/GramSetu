import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';

export const SESSION_COOKIE = 'token';

// Sessions travel only in an HttpOnly cookie. There is deliberately no
// Authorization-header fallback: the browser client never sees the token, so
// a cross-site scripting bug cannot read and replay it.
export const readSessionToken = (req) => {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === SESSION_COOKIE) {
      const value = part.slice(index + 1).trim();
      return value || null;
    }
  }
  return null;
};

const MODELS = { citizen: Citizen, authority: Authority };

/**
 * Verifies the session and loads the account. Returns null for any invalid,
 * expired, revoked or mismatched session. The token names which collection
 * the id belongs to, so a citizen id can never be looked up as an official.
 */
export const resolveSession = async (req) => {
  const token = readSessionToken(req);
  if (!token) return null;

  let claims;
  try {
    claims = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
  } catch {
    return null;
  }

  const Model = MODELS[claims.kind];
  if (!Model || typeof claims.id !== 'string') return null;

  const user = await Model.findById(claims.id).select('-passwordHash');
  if (!user) return null;
  // Logout bumps tokenVersion, which retires every token issued before it.
  if ((user.tokenVersion ?? 0) !== claims.tv) return null;

  return { user, kind: claims.kind };
};

const attach = (req, session) => {
  req.user = session.user;
  req.isCitizen = session.kind === 'citizen';
  req.isAuthority = session.kind === 'authority';
};

const requireSession = (allowedKinds, message) => async (req, res, next) => {
  try {
    const session = await resolveSession(req);
    if (!session) {
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
    if (!allowedKinds.includes(session.kind)) {
      return res.status(403).json({ message });
    }
    attach(req, session);
    next();
  } catch (error) {
    next(error);
  }
};

export const protectAuthority = requireSession(['authority'], 'This action is for official accounts only.');
export const protectCitizen = requireSession(['citizen'], 'This action is for citizen accounts only.');
export const protectAny = requireSession(['citizen', 'authority'], 'Not allowed.');

/** Attaches the user when a valid session exists; never rejects. For public routes that show more to officials. */
export const optionalSession = async (req, res, next) => {
  try {
    const session = await resolveSession(req);
    if (session) attach(req, session);
    next();
  } catch (error) {
    next(error);
  }
};

// Restrict to specific authority roles
export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !req.isAuthority || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Your role is not allowed to do this.' });
  }
  next();
};
