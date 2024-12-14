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
  updateUserRole,
} = require('./service');

const {
  createSchema,
  updateSchema,
  idSchema,
  searchSchema,
  updateUserRoleSchema,
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
    '/:id/detail',
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

  // deactivateUser
  router.put(
    '/:id/deactivate',
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
  router.put(
    '/:id/activate',
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

  // update user's role only
  router.put(
    '/:id/update-role',
    logRequest({}),
    isAuthorized,
    validateRequest({ schema: updateUserRoleSchema, isParam: false }),
    async (req, res, next) => {
      try {
        const updatedUser = await updateUserRole(req.params.id, req.body);
        res.status(200).json(updatedUser);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};

module.exports = { routes };
