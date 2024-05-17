const logger = require('../../libraries/log/logger');

// Authentication Middleware
const isAuthenticated = async (req, res, next) => {
  // Passport's built-in method attached to the request object
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed
  } else {
    logger.warn('User is not authenticated');
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = { isAuthenticated };
