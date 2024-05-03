const productRoutes = require('./product');
const userRoutes = require('./user');

const defineRoutes = async (expressRouter) => {
  productRoutes(expressRouter);
  userRoutes(expressRouter);
};

module.exports = defineRoutes;
