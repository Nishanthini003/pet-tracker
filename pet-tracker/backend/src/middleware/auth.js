import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    // Skip authentication for specific public routes
    if (req.path === '/petitions' && req.method === 'POST') {
      return next();
    }

    if(req.path === '/all' && req.method === 'GET') {
      return next();
    }
    if(req.path === '/:id/status' && req.method === 'PATCH') {
      return next();
    }

    // Check for token in headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    req.user = await User.findById(decoded.id).select('password');
    
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};
export const officerOnly = (req, res, next) => {
  if (req.user?.role === 'department_officer') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an officer');
  }
};

// Admin-only middleware
export const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};
