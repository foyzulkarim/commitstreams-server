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

const fetchRepoSchema = Joi.object().keys({
  username: Joi.string().required(),
  repository: Joi.string().required(),
});

module.exports = { createSchema, updateSchema, idSchema, fetchRepoSchema };
