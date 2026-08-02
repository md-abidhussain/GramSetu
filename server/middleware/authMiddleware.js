import jwt from 'jsonwebtoken';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';

const getCookieToken = (req) => {
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
      const parts = c.trim().split('=');
      if (parts[0]) {
        acc[parts[0]] = parts[1];
      }
      return acc;
    }, {});
    return cookies.token;
  }
  // Fallback to Bearer token for testing/migration
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

// Protect middleware for Authority members
export const protectAuthority = async (req, res, next) => {
  try {
    const token = getCookieToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, official session expired' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_jwt_token_secret_phrase');
    
    // Find in Authority collection
    const user = await Authority.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Authority user no longer exists or session invalid' });
    }

    req.user = user;
    req.isAuthority = true;
    next();
  } catch (error) {
    console.error('Authority auth middleware error:', error.message);
    res.status(401).json({ message: 'Official session expired, please login again' });
  }
};

// Protect middleware for Citizens
export const protectCitizen = async (req, res, next) => {
  try {
    const token = getCookieToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, citizen session expired' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_jwt_token_secret_phrase');

    // Find in Citizen collection
    const user = await Citizen.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Citizen account no longer exists' });
    }

    req.user = user;
    req.isCitizen = true;
    next();
  } catch (error) {
    console.error('Citizen auth middleware error:', error.message);
    res.status(401).json({ message: 'Citizen session expired, please login again' });
  }
};

// Protect middleware for either Citizens or Authorities
export const protectAny = async (req, res, next) => {
  try {
    const token = getCookieToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, session expired' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_jwt_token_secret_phrase');

    // Search Citizen first, then Authority
    let user = await Citizen.findById(decoded.id).select('-passwordHash');
    if (user) {
      req.user = user;
      req.isCitizen = true;
      return next();
    }

    user = await Authority.findById(decoded.id).select('-passwordHash');
    if (user) {
      req.user = user;
      req.isAuthority = true;
      return next();
    }

    return res.status(401).json({ message: 'Account no longer exists' });
  } catch (error) {
    res.status(401).json({ message: 'Session expired, please login again' });
  }
};

// Restrict to specific authority roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.isAuthority || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access restricted to authorized roles: [${roles.join(', ')}]` 
      });
    }
    next();
  };
};
