const { routes } = require('./api');

const defineRoutes = (expressRouter) => {
  expressRouter.use('/repositories', routes());
};

module.exports = defineRoutes;
