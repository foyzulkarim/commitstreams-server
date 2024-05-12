const logger = require('../../libraries/log/logger');

const User = require('../user/schema');
const Repository = require('../repository/schema');
const Model = require('./schema');
const { AppError } = require('../../libraries/error-handling/AppError');
const { decryptToken } = require('../../auth');

const { fetchRepoPullRequests } = require('../../libraries/util/githubUtils');

const model = 'pull';

const create = async (data) => {
  try {
    const item = new Model(data);
    const saved = await item.save();
    logger.info(`create(): ${model} created`, {
      id: saved._id,
    });
    return saved;
  } catch (error) {
    logger.error(`create(): Failed to create ${model}`, error);
    throw new AppError(`Failed to create ${model}`, error.message);
  }
};

const search = async (query) => {
  try {
    const { keyword } = query ?? {};
    const filter = {};
    if (keyword) {
      filter.or = [
        { name: { regex: keyword, options: 'i' } },
        { description: { regex: keyword, options: 'i' } },
      ];
    }
    const items = await Model.find(filter);
    logger.info('search(): filter and count', {
      filter,
      count: items.length,
    });
    return items;
  } catch (error) {
    logger.error(`search(): Failed to search ${model}`, error);
    throw new AppError(`Failed to search ${model}`, error.message, 400);
  }
};

const getById = async (id) => {
  try {
    const item = await Model.findById(id);
    logger.info(`getById(): ${model} fetched`, { id });
    return item;
  } catch (error) {
    logger.error(`getById(): Failed to get ${model}`, error);
    throw new AppError(`Failed to get ${model}`, error.message);
  }
};

const updateById = async (id, data) => {
  try {
    const item = await Model.findByIdAndUpdate(id, data, { new: true });
    logger.info(`updateById(): ${model} updated`, { id });
    return item;
  } catch (error) {
    logger.error(`updateById(): Failed to update ${model}`, error);
    throw new AppError(`Failed to update ${model}`, error.message);
  }
};

const deleteById = async (id) => {
  try {
    await Model.findByIdAndDelete(id);
    logger.info(`deleteById(): ${model} deleted`, { id });
    return true;
  } catch (error) {
    logger.error(`deleteById(): Failed to delete ${model}`, error);
    throw new AppError(`Failed to delete ${model}`, error.message);
  }
};

const mapPullRequestData = (payload) => {
  return {
    id: payload.id,
    node_id: payload.node_id,
    html_url: payload.html_url,
    number: payload.number,
    state: payload.state,
    locked: payload.locked,
    title: payload.title,

    user: {
      login: payload.user.login,
      id: payload.user.id,
      node_id: payload.user.node_id,
      avatar_url: payload.user.avatar_url,
      type: payload.user.type,
    },

    created_at: new Date(payload.created_at),
    updated_at: new Date(payload.updated_at),
    closed_at: payload.closed_at ? new Date(payload.closed_at) : null,
    merged_at: payload.merged_at ? new Date(payload.merged_at) : null,
    draft: payload.draft,

    // pull request details
    merged: payload.merged,
    comments: payload.comments,
    review_comments: payload.review_comments,
    commits: payload.commits,
    additions: payload.additions,
    deletions: payload.deletions,
    changed_files: payload.changed_files,

    source_branch: {
      id: payload.head.repo.id,
      node_id: payload.head.repo.node_id,
      name: payload.head.ref,
      full_name: payload.head.repo.full_name,
    },

    target_branch: {
      id: payload.base.repo.id,
      node_id: payload.base.repo.node_id,
      name: payload.base.ref,
      full_name: payload.base.repo.full_name,
    },
  };
};

const fetchGitHubPullRequests = async (user) => {
  try {
    const { _id } = user;
    const dbUser = await User.findById(_id).exec();

    const { accessToken, accessTokenIV, csFollowingRepositories } = dbUser;
    const token = decryptToken(accessToken, accessTokenIV);

    const repoPromises = csFollowingRepositories.map(async (repo) => {
      const { _id } = repo;
      const dbRepository = await Repository.findById(_id).exec();
      const { owner, name } = dbRepository;
      const pullRequests = await fetchRepoPullRequests(
        owner.login,
        name,
        token
      );

      const mappedPullRequests = pullRequests.map(mapPullRequestData);
      const promises = mappedPullRequests.map(async (pullRequest) => {
        const dbPull = await Model.findOne({ id: pullRequest.id }).exec();
        if (dbPull) {
          logger.info('fetchGitHubPullRequests(): Pull request already exists', {
            id: dbPull._id,
          });
          return dbPull;
        }

        const saved = await create(pullRequest);
        return saved;
      });
      return Promise.all(promises);
    });
    const result = await Promise.all(repoPromises);
    logger.info('fetchGitHubPullRequests(): Pull requests fetched', {
      count: result.length,
    });
    return result;
  } catch (error) {
    throw new AppError(
      'Failed to fetch repository pull requests',
      error.message
    );
  }
};

module.exports = {
  create,
  search,
  getById,
  updateById,
  deleteById,
  fetchGitHubPullRequests,
};
