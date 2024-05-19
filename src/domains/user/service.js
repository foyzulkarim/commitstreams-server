const logger = require('../../libraries/log/logger');

const Model = require('./schema');
const { AppError } = require('../../libraries/error-handling/AppError');

const model = 'user';
const projection = { accessToken: 0, accessTokenIV: 0 };

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
    logger.info(`search(): ${model} search`, { query });
    const pageSize = 10;
    const {
      keyword,
      page = 0,
      orderBy = 'username',
      order = 'asc',
    } = query ?? {};

    const filter = {};
    if (keyword) {
      // like search on multiple fields with keyword
      filter.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { displayName: { $regex: keyword, $options: 'i' } },
      ];
    }

    // implement paginated search with order and orderBy
    const items = await Model.find(filter, projection)
      .sort({ [orderBy]: order === 'asc' ? 1 : -1 })
      .skip(page * pageSize)
      .limit(pageSize);

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

// count of the items without skip and limit
const count = async (query) => {
  try {
    const { keyword } = query ?? {};

    const filter = {};
    if (keyword) {
      // like search on multiple fields with keyword
      filter.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { displayName: { $regex: keyword, $options: 'i' } },
      ];
    }
    const total = await Model.countDocuments(filter);
    logger.info('count(): filter and count', {
      filter,
      count: total,
    });
    return total;
  } catch (error) {
    logger.error(`count(): Failed to count ${model}`, error);
    throw new AppError(`Failed to count ${model}`, error.message, 400);
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

const deactivateUser = async (id) => {
  try {
    const item = await Model.findByIdAndUpdate(id, { isDeactivated: true });
    logger.info(`deactivateUser(): ${model} deactivated`, { id });
    return item;
  } catch (error) {
    logger.error(`deactivateUser(): Failed to deactivate ${model}`, error);
    throw new AppError(`Failed to deactivate ${model}`, error.message);
  }
};

const activateUser = async (id) => {
  try {
    const item = await Model.findByIdAndUpdate(id, { isDeactivated: false });
    logger.info(`activateUser(): ${model} activated`, { id });
    return item;
  } catch (error) {
    logger.error(`activateUser(): Failed to activate ${model}`, error);
    throw new AppError(`Failed to activate ${model}`, error.message);
  }
};

const getByGitHubId = async (id) => {
  try {
    const item = await Model.findOne({ githubId: id });
    return item;
  } catch (error) {
    logger.error(`getByGitHubId(): Failed to get ${model} by githubId`, error);
    throw new AppError(`Failed to get ${model} by githubId`, error.message);
  }
};

const followUser = async (followerId, followedId) => {
  try {
    // Check existing following status (Optimized)
    const follower = await Model.findById(followerId);
    const existingFollowing = follower.csFollowing.find(
      (item) => item._id.toString() === followedId.toString()
    );

    if (existingFollowing) {
      logger.info(
        `followUser(): User ${followerId} is already following user ${followedId}`
      );
      return true;
    }

    // Perform the updates
    const [followedUserUpdate, followerUserUpdate] = await Promise.all([
      // Update csFollowers of the followed user
      Model.findByIdAndUpdate(followedId, {
        $push: { csFollowers: { _id: followerId, date: Date.now() } }, // Add follow date
      }),

      // Update csFollowing of the follower user
      Model.findByIdAndUpdate(followerId, {
        $push: { csFollowing: { _id: followedId, date: Date.now() } },
      }),
    ]);

    logger.info(`followUser(): success`, {
      followedId,
      followedId,
      followedUserUpdate,
      followerUserUpdate,
    });
    return true;
  } catch (error) {
    logger.error(`followUser(): Failed to update follow status`, error);
    throw new AppError(`Failed to update follow status`, error.message);
  }
};

module.exports = {
  create,
  search,
  count,
  getById,
  updateById,
  deleteById,
  getByGitHubId,
  followUser,
  deactivateUser,
  activateUser,
};
