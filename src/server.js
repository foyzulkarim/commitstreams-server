const config = require('./configs');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const pick = require('lodash/pick');
const get = require('lodash/get');

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');

const defineRoutes = require('./app');
const { errorHandler } = require('./libraries/error-handling');
const logger = require('./libraries/log/logger');
const { addRequestIdMiddleware } = require('./middlewares/request-context');
const { connectWithMongoDb } = require('./libraries/db');

let connection;

const createExpressApp = () => {
  const expressApp = express();
  expressApp.use(addRequestIdMiddleware);
  expressApp.use(helmet());
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.use(express.json());
  expressApp.use(cookieParser());
  expressApp.use(
    cors({
      origin: config.CLIENT_HOST, // Your frontend origin
      credentials: true,
    })
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: config.GITHUB_CLIENT_ID,
        clientSecret: config.GITHUB_CLIENT_SECRET,
        callbackURL: `${config.HOST}/auth/github/callback`,
      },
      function (accessToken, refreshToken, profile, cb) {
        const pickedProfile = pick(profile, [
          'id',
          'nodeId',
          'profileUrl',
          'provider',
          'username',
        ]);
        const email = get(profile, 'emails[0].value', '');
        logger.info('GitHub profile:', { ...pickedProfile, email });
        // Find or create a user in your database here
        // For now, we'll just return the profile
        profile.accessToken = accessToken;
        return cb(null, profile);
      }
    )
  );

  expressApp.use(
    session({
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
    })
  );

  expressApp.use(passport.initialize());
  expressApp.use(passport.session());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  expressApp.use((req, res, next) => {
    // Log an info message for each incoming request
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });

  logger.info('Express middlewares are set up');

  expressApp.get('/auth/github', passport.authenticate('github'));
  expressApp.get(
    '/auth/github/callback',
    passport.authenticate('github', {
      failureRedirect: `${config.CLIENT_HOST}/login`,
    }),
    function (req, res) {
      logger.info('/auth/github/callback', { username: req.user.username });
      // prepare the cookie here
      const accessToken = req.user.accessToken; // Assuming this exists

      res.cookie('authToken', accessToken, {
        httpOnly: true,
        secure: true, // Use secure in production (HTTPS)
        sameSite: 'lax', // Adjust depending on deployment
      });
      // Successful authentication, redirect home.
      res.redirect(`${config.CLIENT_HOST}/login-success`);
    }
  );
  // get current logged in user data from req.user object
  expressApp.get('/api/user', (req, res) => {
    if (!req.user) {
      console.log('headers', req.headers);
      return res.status(401).send('Unauthorized');
    }

    res.json(req.user);
  });
  expressApp.get('/api/github-data', (req, res) => {
    if (!req.user) {
      return res.status(401).send('Unauthorized');
    }

    const accessToken = req.user.accessToken;

    axios
      .get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      })
      .then((response) => {
        res.json(response.data);
      })
      .catch((error) => {
        console.error('Error fetching GitHub data:', error);
        res.status(500).json({ error: 'Error fetching data' });
      });
  });
  expressApp.post('/api/logout', (req, res) => {
    req.logout(function (err) {
      // Passport.js logout function
      if (err) {
        return next(err);
      }

      req.session.destroy(function (err) {
        // Handle potential errors during session destruction
        res.json('Logged out successfully');
      });
    });
  });

  defineRoutes(expressApp);
  defineErrorHandlingMiddleware(expressApp);
  return expressApp;
};

async function startWebServer() {
  logger.info('Starting web server...');
  const expressApp = createExpressApp();
  const APIAddress = await openConnection(expressApp);
  logger.info(`Server is running on ${APIAddress.address}:${APIAddress.port}`);
  await connectWithMongoDb();
  return expressApp;
}

async function stopWebServer() {
  return new Promise((resolve) => {
    if (connection !== undefined) {
      connection.close(() => {
        resolve();
      });
    }
  });
}

async function openConnection(expressApp) {
  return new Promise((resolve) => {
    const webServerPort = config.PORT;
    logger.info(`Server is about to listen to port ${webServerPort}`);

    connection = expressApp.listen(webServerPort, () => {
      errorHandler.listenToErrorEvents(connection);
      resolve(connection.address());
    });
  });
}

function defineErrorHandlingMiddleware(expressApp) {
  expressApp.use(async (error, req, res, next) => {
    // Note: next is required for Express error handlers
    if (error && typeof error === 'object') {
      if (error.isTrusted === undefined || error.isTrusted === null) {
        error.isTrusted = true;
      }
    }

    errorHandler.handleError(error);
    res.status(error?.HTTPStatus || 500).end();
  });
}

module.exports = { createExpressApp, startWebServer, stopWebServer };
