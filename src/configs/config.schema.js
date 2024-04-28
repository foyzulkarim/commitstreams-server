const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  MONGODB_URI: Joi.string().required(),
  RATE: Joi.number().min(0).required(),
  PORT: Joi.number().min(1000).default(4000),
  // LOGGLY is required when NODE_ENV is production
  LOGGLY_TOKEN: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  LOGGLY_SUBDOMAIN: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  GITHUB_CLIENT_ID: Joi.string().required(),
  GITHUB_CLIENT_SECRET: Joi.string().required(),
  // host should start with http:// or https://
  HOST: Joi.string()
    .pattern(/^(http:\/\/|https:\/\/)/)
    .required(),
  CLIENT_HOST: Joi.string()
    .pattern(/^(http:\/\/|https:\/\/)/)
    .required(),
  SESSION_SECRET: Joi.string().required(),
});

module.exports = schema;
