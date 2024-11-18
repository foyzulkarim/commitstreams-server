const { routes } = require('./api');

const defineRoutes = (expressRouter) => {
  expressRouter.use('/resources', routes());
};

module.exports = defineRoutes;
