const Joi = require('joi');
const mongoose = require('mongoose');

const createSchema = Joi.object().keys({
  name: Joi.string().required(),
  // other properties
});

const updateSchema = Joi.object().keys({
  name: Joi.string(),
  // other properties
});

const idSchema = Joi.object().keys({
  id: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'ObjectId validation')
    .required(),
});

const searchSchema = Joi.object({
  keyword: Joi.string().allow('').optional().max(10),
  page: Joi.number().integer().min(0),
  orderBy: Joi.string(),
  order: Joi.string().valid('asc', 'desc'),
});

const updateUserRoleSchema = Joi.object().keys({
  roleId: Joi.string().required(),
});

module.exports = { createSchema, updateSchema, idSchema, searchSchema, updateUserRoleSchema };
