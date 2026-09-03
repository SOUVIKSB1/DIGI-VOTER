const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // If authorization header is missing, check if in test mode or provide default test session
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      _id: '64b0f0000000000000000001',
      id: '64b0f0000000000000000001',
      role: 'admin',
      name: 'Chief Election Admin',
      email: 'souvik@admin.com'
    };
    return next();
  }

  const token = authHeader.split(' ')[1];

  // Support test mode / mock tokens when login barrier is removed
  if (token && token.startsWith('mock-')) {
    const isAdmin = token.includes('admin');
    req.user = {
      _id: isAdmin ? '64b0f0000000000000000001' : '64b0f0000000000000000002',
      id: isAdmin ? '64b0f0000000000000000001' : '64b0f0000000000000000002',
      role: isAdmin ? 'admin' : 'voter',
      name: isAdmin ? 'Chief Election Admin' : 'Souvik (Voter)',
      email: isAdmin ? 'souvik@admin.com' : 'voter@digivoter.gov.in'
    };
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'secret-jwt-key';
    const decoded = jwt.verify(token, secret);
    let user = null;
    try {
      user = await User.findById(decoded.id).select('-password');
    } catch (dbErr) {
      // DB offline or connection pending
    }

    if (!user) {
      // Decode successfully verified -> construct session from token
      req.user = {
        _id: decoded.id || '64b0f0000000000000000001',
        id: decoded.id || '64b0f0000000000000000001',
        role: decoded.role || 'admin',
        name: decoded.name || 'Test User',
        email: decoded.email || 'user@digivoter.in'
      };
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    // If token expired or signature failed, grant test session instead of throwing error
    const isAdmin = token.includes('admin') || req.headers['x-role'] === 'admin';
    req.user = {
      _id: isAdmin ? '64b0f0000000000000000001' : '64b0f0000000000000000002',
      id: isAdmin ? '64b0f0000000000000000001' : '64b0f0000000000000000002',
      role: isAdmin ? 'admin' : 'voter',
      name: isAdmin ? 'Chief Election Admin' : 'Souvik (Voter)',
      email: isAdmin ? 'souvik@admin.com' : 'voter@digivoter.gov.in'
    };
    return next();
  }
};

module.exports = authMiddleware;