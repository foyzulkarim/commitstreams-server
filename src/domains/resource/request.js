const Joi = require('joi');
const mongoose = require('mongoose');

const createSchema = Joi.object().keys({
  name: Joi.string().required().lowercase().trim(),
  displayName: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  identifier: Joi.string().required(),
  type: Joi.string().valid('api', 'ui', 'menu').default('api')
});

const updateSchema = Joi.object().keys({
  name: Joi.string().lowercase().trim(),
  displayName: Joi.string(),
  description: Joi.string().allow(''),
  identifier: Joi.string(),
  type: Joi.string().valid('api', 'ui', 'menu')
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
  keyword: Joi.string().allow('').optional().max(50),
  page: Joi.number().integer().min(0),
  orderBy: Joi.string(),
  order: Joi.string().valid('asc', 'desc'),
  type: Joi.string().valid('api', 'ui', 'menu')
});

module.exports = { createSchema, updateSchema, idSchema, searchSchema };
