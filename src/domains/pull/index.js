const { routes } = require('./api');

const defineRoutes = (expressRouter) => {
  expressRouter.use('/pulls', routes());
};

module.exports = defineRoutes;
