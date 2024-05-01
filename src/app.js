const express = require('express');
const logger = require('./libraries/log/logger');
const domainRoutes = require('./domains/index');
const packageJson = require('../package.json');

function formatUptime(uptime) {
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = Math.floor(uptime % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function defineRoutes(expressApp) {
  logger.info('Defining routes...');
  const router = express.Router();

  domainRoutes(router);

  // Authentication Middleware
  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      // Passport's built-in method
      return next(); // User is authenticated, proceed
    } else {
      logger.warn('User is not authenticated');
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }

  expressApp.use('/api/v1', isAuthenticated, router);
  // health check
  expressApp.get('/health', (req, res) => {
    const healthCheck = {
      uptime: process.uptime(),
      formattedUptime: formatUptime(process.uptime()),
      message: 'OK',
      timestamp: Date.now(),
      version: packageJson.version,
    };
    res.status(200).json(healthCheck);
  });
  // 404 handler
  expressApp.use((req, res) => {
    res.status(404).send('Not Found');
  });
  logger.info('Routes defined');
}

module.exports = defineRoutes;
