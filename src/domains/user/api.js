const express = require('express');
const logger = require('../../libraries/log/logger');
const { AppError } = require('../../libraries/error-handling/AppError');

const {
  create,
  search,
  count,
  getById,
  updateById,
  deleteById,
  followUser,
  deactivateUser,
  activateUser,
} = require('./service');

const {
  createSchema,
  updateSchema,
  idSchema,
  searchSchema,
} = require('./request');
const { validateRequest } = require('../../middlewares/request-validate');
const { logRequest } = require('../../middlewares/log');
const { isAuthorized } = require('../../middlewares/auth/authorization');

const model = 'User';

// CRUD for entity
const routes = () => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  router.get(
    '/search',
    logRequest({}),
    validateRequest({ schema: searchSchema, isQuery: true }),
    async (req, res, next) => {
      try {
        const items = await search(req.query);
        res.json(items);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/count',
    logRequest({}),
    validateRequest({ schema: searchSchema, isQuery: true }),
    async (req, res, next) => {
      try {
        const total = await count(req.query);
        res.json({ total });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/detail/:id',
    logRequest({}),
    validateRequest({ schema: idSchema, isParam: true }),
    async (req, res, next) => {
      try {
        const item = await getById(req.params.id);
        if (!item) {
          throw new AppError(`${model} not found`, `${model} not found`, 404);
        }
        res.status(200).json(item);
      } catch (error) {
        next(error);
      }
    }
  );

  const destroySession = async (deactivatedUser, sessionStore) => {
    const result = await new Promise((resolve, reject) => {
      sessionStore.all((err, sessions = []) => {
        // find the sessionId by userId
        const session = sessions.find(
          (session) => session.userId === deactivatedUser?._id?.toString()
        );
        const sessionId = session?.sessionId;

        if (sessionId) {
          logger.info('destroySession(): sessionId', { sessionId });
          sessionStore.destroy(sessionId, (err) => {
            if (err) {
              logger.error('Failed to destroy session', err);
              reject(err);
            } else {
              logger.info('Session destroyed');
              resolve(true);
            }
          });
        } else {
          logger.info('No session found to destroy');
          resolve(true);
        }
      });
    });
    return result;
  };

  router.delete(
    '/remove/:id',
    logRequest({}),
    isAuthorized,
    validateRequest({ schema: idSchema, isParam: true }),
    async (req, res, next) => {
      try {
        const deactivatedUser = await deactivateUser(req.params.id);
        // remove the deactivated user's session from the session store
        const result = await destroySession(deactivatedUser, req.sessionStore);
        logger.info('delete() deactivate user result', {
          result,
          username: deactivatedUser.username,
        });
        res.status(200).json({
          message: `${deactivatedUser.username} has been deactivated`,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // activateUser
  router.post(
    '/activate/:id',
    logRequest({}),
    isAuthorized,
    validateRequest({ schema: idSchema, isParam: true }),
    async (req, res, next) => {
      try {
        const activatedUser = await activateUser(req.params.id);
        res
          .status(200)
          .json({ message: `${activatedUser.username} has been activated` });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};

module.exports = { routes };
