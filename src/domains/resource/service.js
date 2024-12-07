const logger = require('../../libraries/log/logger');
const Model = require('./schema');
const { AppError } = require('../../libraries/error-handling/AppError');

const model = 'resource';

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
      orderBy = 'name',
      order = 'asc',
      type
    } = query ?? {};

    const filter = {};
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { displayName: { $regex: keyword, $options: 'i' } },
        { identifier: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (type) {
      filter.type = type;
    }

    const items = await Model.find(filter)
      .sort({ [orderBy]: order === 'asc' ? 1 : -1 });

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

const count = async (query) => {
  try {
    const { keyword, type } = query ?? {};
    const filter = {};
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { displayName: { $regex: keyword, $options: 'i' } },
        { identifier: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (type) {
      filter.type = type;
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

const getAllGroupedByType = async () => {
  try {
    const resources = await Model.find({})
      .sort({ type: 1, displayName: 1 })
      .lean();

    // Group resources by type
    const grouped = resources.reduce((acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = [];
      }
      acc[resource.type].push({
        id: resource._id,
        name: resource.name,
        displayName: resource.displayName,
        description: resource.description,
        identifier: resource.identifier
      });
      return acc;
    }, {});

    logger.info('getAllGroupedByType(): Resources fetched and grouped');
    return grouped;
  } catch (error) {
    logger.error('getAllGroupedByType(): Failed to fetch resources', error);
    throw new AppError('Failed to fetch resources', error.message, 400);
  }
};

module.exports = {
  create,
  search,
  count,
  getById,
  updateById,
  deleteById,
  getAllGroupedByType,
};
