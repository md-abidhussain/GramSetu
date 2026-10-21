import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';
import { getJwtSecret, isProduction } from '../config/env.js';
import { SESSION_COOKIE, readSessionToken } from '../middleware/authMiddleware.js';
import {
  describePasswordProblem,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  toIdentifier
} from '../utils/credentials.js';
import { toText } from '../utils/validators.js';
import { ALL_OFFICIAL_ROLES, ROLES } from '../utils/roles.js';

export const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;
const BCRYPT_ROUNDS = 12;

// Compared against when no account matches, so a wrong email takes as long to
// reject as a wrong password and response time does not reveal which it was.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', BCRYPT_ROUNDS);

export const signSession = (user, kind) =>
  jwt.sign({ id: String(user._id), kind, tv: user.tokenVersion ?? 0 }, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: TOKEN_LIFETIME_SECONDS
  });

const cookieFlags = () => {
  // SameSite=Lax: the browser will not attach the cookie to cross-site POSTs,
  // which together with the Origin allowlist in app.js blocks CSRF. The app is
  // served same-origin (Vercel rewrites /api to the backend), so Lax works.
  const flags = ['Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (isProduction() || process.env.COOKIE_SECURE === 'true') flags.push('Secure');
  return flags;
};

const setSessionCookie = (res, token) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; ${[...cookieFlags(), `Max-Age=${TOKEN_LIFETIME_SECONDS}`].join('; ')}`);
};

const clearSessionCookie = (res) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${[...cookieFlags(), 'Max-Age=0'].join('; ')}`);
};

// What the browser is told about an account. The session token is never in a
// response body: it lives only in the HttpOnly cookie.
const publicAuthority = (authority) => ({
  _id: authority._id,
  name: authority.name,
  email: authority.email,
  uniqueUserId: authority.uniqueUserId,
  role: authority.role,
  isAuthority: true
});

const publicCitizen = (citizen) => ({
  _id: citizen._id,
  name: citizen.name,
  email: citizen.email,
  phone: citizen.phone,
  role: 'citizen',
  isCitizen: true
});

// The id is one of the things an official logs in with, so it must not be
// guessable: crypto.randomInt over a billion values.
const generateUniqueAuthorityId = async () => {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `AUTH-${year}-${String(randomInt(0, 1_000_000_000)).padStart(9, '0')}`;
    if (!(await Authority.exists({ uniqueUserId: candidate }))) return candidate;
  }
  throw new Error('Could not allocate an official user id.');
};

// Admin creates an official. The Admin stays signed in as themselves: no
// session is issued for the new account.
export const registerAuthority = async (req, res, next) => {
  try {
    const name = toText(req.body.name, 100);
    const email = toIdentifier(req.body.email).toLowerCase();
    const { password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'That does not look like an email address.' });
    }
    const passwordProblem = describePasswordProblem(password);
    if (passwordProblem) return res.status(400).json({ message: passwordProblem });
    if (!ALL_OFFICIAL_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Choose one of the official roles.' });
    }

    if (await Authority.exists({ email })) {
      return res.status(409).json({ message: 'An official with this email already exists.' });
    }

    const authority = await Authority.create({
      name,
      email,
      uniqueUserId: await generateUniqueAuthorityId(),
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      role
    });

    res.status(201).json(publicAuthority(authority));
  } catch (error) {
    next(error);
  }
};

const invalidCredentials = (res) => res.status(401).json({ message: 'Those sign-in details are not correct.' });

export const loginAuthority = async (req, res, next) => {
  try {
    // Forced to a string first: {"identifier": {"$ne": null}} would otherwise
    // reach MongoDB as an operator rather than a value to match.
    const identifier = toIdentifier(req.body.identifier);
    const { password } = req.body;
    if (!identifier || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Enter your official ID or email, and your password.' });
    }

    const authority = await Authority.findOne({
      $or: [{ email: identifier.toLowerCase() }, { uniqueUserId: identifier.toUpperCase() }]
    });
    const passwordMatches = await bcrypt.compare(password, authority?.passwordHash ?? DUMMY_HASH);
    if (!authority || !passwordMatches) return invalidCredentials(res);

    setSessionCookie(res, signSession(authority, 'authority'));
    res.json(publicAuthority(authority));
  } catch (error) {
    next(error);
  }
};

export const registerCitizen = async (req, res, next) => {
  try {
    const name = toText(req.body.name, 100);
    const email = toIdentifier(req.body.email).toLowerCase();
    const phone = req.body.phone ? normalizePhone(req.body.phone) : '';
    const { password } = req.body;

    if (!name) return res.status(400).json({ message: 'Enter your name (up to 100 characters).' });
    if (!email && !req.body.phone) {
      return res.status(400).json({ message: 'Give an email address or a mobile number.' });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: 'That does not look like an email address.' });
    }
    if (req.body.phone && !isValidPhone(req.body.phone)) {
      return res.status(400).json({ message: 'Enter a ten digit Indian mobile number.' });
    }
    const passwordProblem = describePasswordProblem(password);
    if (passwordProblem) return res.status(400).json({ message: passwordProblem });

    const clash = [];
    if (email) clash.push({ email });
    if (phone) clash.push({ phone });
    if (await Citizen.exists({ $or: clash })) {
      // One message for either field, so this endpoint cannot be used to test
      // which specific email or number is registered.
      return res.status(409).json({ message: 'An account with these details already exists. Try signing in.' });
    }

    const citizen = await Citizen.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS)
    });

    setSessionCookie(res, signSession(citizen, 'citizen'));
    res.status(201).json(publicCitizen(citizen));
  } catch (error) {
    // Two simultaneous registrations can both pass the check above; the unique
    // index is the real guard.
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with these details already exists. Try signing in.' });
    }
    next(error);
  }
};

export const loginCitizen = async (req, res, next) => {
  try {
    const identifier = toIdentifier(req.body.identifier);
    const { password } = req.body;
    if (!identifier || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Enter your email or mobile number, and your password.' });
    }

    const phone = isValidPhone(identifier) ? normalizePhone(identifier) : null;
    const citizen = await Citizen.findOne({
      $or: [{ email: identifier.toLowerCase() }, ...(phone ? [{ phone }] : [])]
    });
    const passwordMatches = await bcrypt.compare(password, citizen?.passwordHash ?? DUMMY_HASH);
    if (!citizen || !passwordMatches) return invalidCredentials(res);

    setSessionCookie(res, signSession(citizen, 'citizen'));
    res.json(publicCitizen(citizen));
  } catch (error) {
    next(error);
  }
};

export const me = (req, res) => {
  res.json(req.isAuthority ? publicAuthority(req.user) : publicCitizen(req.user));
};

export const getInspectors = async (req, res, next) => {
  try {
    const inspectors = await Authority.find({ role: ROLES.INSPECTOR }).select('name uniqueUserId').sort({ name: 1 }).lean();
    res.json(inspectors);
  } catch (error) {
    next(error);
  }
};

// Revokes every session for this account (tokenVersion bump), not just the
// cookie in this browser, so a copied token stops working too.
export const logout = async (req, res, next) => {
  try {
    const token = readSessionToken(req);
    if (token) {
      try {
        const claims = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
        const Model = claims.kind === 'authority' ? Authority : claims.kind === 'citizen' ? Citizen : null;
        if (Model && typeof claims.id === 'string') {
          await Model.updateOne({ _id: claims.id, tokenVersion: claims.tv }, { $inc: { tokenVersion: 1 } });
        }
      } catch {
        // An expired or forged token has nothing to revoke.
      }
    }
    clearSessionCookie(res);
    res.json({ message: 'Signed out.' });
  } catch (error) {
    next(error);
  }
};
