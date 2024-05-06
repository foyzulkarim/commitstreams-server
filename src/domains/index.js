const productRoutes = require('./product');
const userRoutes = require('./user');
const repositoryRoutes = require('./repository');
const prRoutes = require('./pull');

const defineRoutes = async (expressRouter) => {
  productRoutes(expressRouter);
  userRoutes(expressRouter);
  repositoryRoutes(expressRouter);
  prRoutes(expressRouter);
};

module.exports = defineRoutes;
