const express = require('express');
const logger = require('../../libraries/log/logger');
const { AppError } = require('../../libraries/error-handling/AppError');

const {
  create,
  search,
  count,
  searchOne,
  getById,
  updateById,
  deleteById,
  fetchGitHubRepoDetails,
  followRepository,
} = require('./service');

const {
  createSchema,
  updateSchema,
  idSchema,
  searchSchema,
  fetchRepoSchema,
} = require('./request');
const { validateRequest } = require('../../middlewares/request-validate');
const { logRequest } = require('../../middlewares/log');

const model = 'Repository';

// CRUD for entity
const routes = () => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  // '/search'
  router.get(
    '/search',
    logRequest({}),
    validateRequest({ schema: searchSchema, isQuery: true }),
    async (req, res, next) => {
      try {
        // TODO: Add pagination and filtering
        const items = await search(req.query);
        res.json(items);
      } catch (error) {
        next(error);
      }
    }
  );

  // '/count',
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

  // '/search-one'
  router.post(
    '/search-one',
    logRequest({}),
    validateRequest({ schema: fetchRepoSchema }),
    async (req, res, next) => {
      try {
        // TODO: Add pagination and filtering
        const item = await searchOne(req.body);
        res.json(item);
      } catch (error) {
        next(error);
      }
    }
  );

  // '/fetch-from-github' fetch repository details from GitHub API
  router.post(
    '/fetch-from-github',
    logRequest({}),
    validateRequest({ schema: fetchRepoSchema }),
    async (req, res, next) => {
      try {
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

  //'/:id/follow'
  router.get(
    '/:id/follow',
    logRequest({}),
    validateRequest({ schema: idSchema, isParam: true }),
    async (req, res, next) => {
      const currentUserId = req.user._id;
      try {
        const result = await followRepository(currentUserId, req.params.id);
        res.status(200).json({ result });
      } catch (error) {
        next(error);
      }
    }
  );

  //'/:id',
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

  return router;
};

module.exports = { routes };
