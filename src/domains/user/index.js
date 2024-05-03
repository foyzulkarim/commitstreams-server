const { routes } = require('./api');

const defineRoutes = (expressRouter) => {
  expressRouter.use('/users', routes());
};

module.exports = defineRoutes;
