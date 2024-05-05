const productRoutes = require('./product');
const userRoutes = require('./user');
const repositoryRoutes = require('./repository');

const defineRoutes = async (expressRouter) => {
  productRoutes(expressRouter);
  userRoutes(expressRouter);
  repositoryRoutes(expressRouter);
};

module.exports = defineRoutes;
