const express = require('express');
const logger = require('../../libraries/log/logger');
const { AppError } = require('../../libraries/error-handling/AppError');

const {
  create,
  search,
  getById,
  updateById,
  deleteById,
  fetchGitHubRepoDetails,
} = require('./service');

const {
  createSchema,
  updateSchema,
  idSchema,
  fetchRepoSchema,
} = require('./request');
const { validateRequest } = require('../../middlewares/request-validate');
const { logRequest } = require('../../middlewares/log');

const model = 'Repository';

// CRUD for entity
const routes = () => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  router.post(
    '/search',
    logRequest({}),
    validateRequest({ schema: fetchRepoSchema }),
    async (req, res, next) => {
      try {
        // TODO: Add pagination and filtering
        const item = await search(req.body);
        res.json(item);
      } catch (error) {
        next(error);
      }
    }
  );

  // fetch repository details from GitHub API
  router.post(
    '/fetch-from-github',
    logRequest({}),
    validateRequest({ schema: fetchRepoSchema }),
    async (req, res, next) => {
      try {
        console.log('req.user._id', req.user);

        const { username, repository } = req.body;
        const repoDetails = await fetchGitHubRepoDetails(
          username,
          repository,
          req.user
        );
        res.status(200).json(repoDetails);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/',
    logRequest({}),
    validateRequest({ schema: createSchema }),
    async (req, res, next) => {
      try {
        const item = await create(req.body);
        res.status(201).json(item);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/:id',
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

  router.put(
    '/:id',
    logRequest({}),
    validateRequest({ schema: idSchema, isParam: true }),
    validateRequest({ schema: updateSchema }),
    async (req, res, next) => {
      try {
        const item = await updateById(req.params.id, req.body);
        if (!item) {
          throw new AppError(`${model} not found`, `${model} not found`, 404);
        }
        res.status(200).json(item);
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/:id',
    logRequest({}),
    validateRequest({ schema: idSchema, isParam: true }),
    async (req, res, next) => {
      try {
        await deleteById(req.params.id);
        res.status(204).json({ message: `${model} is deleted` });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};

module.exports = { routes };
