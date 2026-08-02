import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secure_jwt_token_secret_phrase', {
    expiresIn: '30d'
  });
};

const sendTokenCookie = (res, token) => {
  res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
};

// Generate unique ID for authority: AUTH-2026-XXXX
const generateUniqueAuthorityId = async () => {
  let uniqueId = '';
  let exists = true;
  while (exists) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit number
    uniqueId = `AUTH-2026-${randomNum}`;
    const found = await Authority.findOne({ uniqueUserId: uniqueId });
    if (!found) {
      exists = false;
    }
  }
  return uniqueId;
};

export const registerAuthority = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and official role are required' });
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
    const { identifier, password } = req.body; // identifier can be email or uniqueUserId

    if (!identifier || !password) {
      return res.status(400).json({ message: 'User ID/Email and password are required' });
    }

    // Search by email or uniqueUserId
    const authority = await Authority.findOne({
      $or: [{ email: identifier }, { uniqueUserId: identifier }]
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
    const { name, email, phone, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required' });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: 'Either Gmail (email) or Mobile Number is required' });
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
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    const citizen = await Citizen.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
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
