import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '../config/env.js';
import {
  describePasswordProblem,
  isValidEmail,
  isValidPhone,
  toIdentifier
} from '../utils/credentials.js';
import { randomInt } from 'node:crypto';

const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: TOKEN_LIFETIME_SECONDS });
};

const sendTokenCookie = (res, token) => {
  const flags = ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${TOKEN_LIFETIME_SECONDS}`];
  if (process.env.NODE_ENV === 'production') flags.push('Secure');
  res.setHeader('Set-Cookie', `token=${token}; ${flags.join('; ')}`);
};

// Generate unique ID for authority: AUTH-2026-XXXX
// This id is one of the things an official logs in with, so it must not be
// guessable. The old version drew a four digit number from Math.random, which
// gave 9000 possible ids: enough to guess, and enough to run out of.
const generateUniqueAuthorityId = async () => {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `AUTH-${year}-${String(randomInt(0, 1_000_000_000)).padStart(9, '0')}`;
    const taken = await Authority.findOne({ uniqueUserId: candidate });
    if (!taken) {
      return candidate;
    }
  }

  throw new Error('Could not allocate an official user id.');
};

export const registerAuthority = async (req, res, next) => {
  try {
    const { name, password, role } = req.body;
    const email = toIdentifier(req.body.email).toLowerCase();

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and official role are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'That does not look like an email address.' });
    }

    const passwordProblem = describePasswordProblem(password);
    if (passwordProblem) {
      return res.status(400).json({ message: passwordProblem });
    }

    const allowedRoles = ['Government Officer', 'Inspector', 'District Authority', 'PWD Engineer', 'Admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid authority role selection' });
    }

    const emailExists = await Authority.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Authority email address already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const uniqueUserId = await generateUniqueAuthorityId();

    const authority = await Authority.create({
      name,
      email,
      uniqueUserId,
      passwordHash,
      role
    });

    const token = generateToken(authority._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      _id: authority._id,
      name: authority.name,
      email: authority.email,
      uniqueUserId: authority.uniqueUserId,
      role: authority.role,
      token,
      isAuthority: true
    });
  } catch (error) {
    next(error);
  }
};

export const loginAuthority = async (req, res, next) => {
  try {
    // Forced to a string first: a body of {"identifier": {"$ne": null}} would
    // otherwise reach Mongo as an operator rather than as a value to match.
    const identifier = toIdentifier(req.body.identifier);
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'User ID/Email and password are required' });
    }

    // Search by email or uniqueUserId
    const authority = await Authority.findOne({
      // Email is stored lowercase at registration, so it is matched lowercase.
      // The official id is not: it is issued in upper case.
      $or: [{ email: identifier.toLowerCase() }, { uniqueUserId: identifier }]
    });

    if (authority && (await authority.comparePassword(password))) {
      const token = generateToken(authority._id);
      sendTokenCookie(res, token);

      res.json({
        _id: authority._id,
        name: authority.name,
        email: authority.email,
        uniqueUserId: authority.uniqueUserId,
        role: authority.role,
        token,
        isAuthority: true
      });
    } else {
      res.status(401).json({ message: 'Invalid Official credentials' });
    }
  } catch (error) {
    next(error);
  }
};

export const registerCitizen = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const email = toIdentifier(req.body.email).toLowerCase();
    const phone = toIdentifier(req.body.phone);

    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required' });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: 'Either an email address or a mobile number is required' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: 'That does not look like an email address.' });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ message: 'Enter a ten digit Indian mobile number.' });
    }

    const passwordProblem = describePasswordProblem(password);
    if (passwordProblem) {
      return res.status(400).json({ message: passwordProblem });
    }

    // Check for duplicate citizen entry
    if (email) {
      const emailExists = await Citizen.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Citizen with this email already exists' });
      }
    }

    if (phone) {
      const phoneExists = await Citizen.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Citizen with this mobile number already exists' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const citizen = await Citizen.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      passwordHash
    });

    const token = generateToken(citizen._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      _id: citizen._id,
      name: citizen.name,
      email: citizen.email,
      phone: citizen.phone,
      role: 'citizen',
      token,
      isCitizen: true
    });
  } catch (error) {
    next(error);
  }
};

export const loginCitizen = async (req, res, next) => {
  try {
    const identifier = toIdentifier(req.body.identifier);
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    const citizen = await Citizen.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }]
    });

    if (citizen && (await citizen.comparePassword(password))) {
      const token = generateToken(citizen._id);
      sendTokenCookie(res, token);

      res.json({
        _id: citizen._id,
        name: citizen.name,
        email: citizen.email,
        phone: citizen.phone,
        role: 'citizen',
        token,
        isCitizen: true
      });
    } else {
      res.status(401).json({ message: 'Invalid Citizen credentials' });
    }
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    if (req.isAuthority) {
      return res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        uniqueUserId: req.user.uniqueUserId,
        role: req.user.role,
        isAuthority: true
      });
    } else if (req.isCitizen) {
      return res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: 'citizen',
        isCitizen: true
      });
    }
    res.status(404).json({ message: 'Session invalid' });
  } catch (error) {
    next(error);
  }
};

export const getInspectors = async (req, res, next) => {
  try {
    const inspectors = await Authority.find({ role: 'Inspector' }).select('name uniqueUserId');
    res.json(inspectors);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ message: 'Logged out successfully' });
};
