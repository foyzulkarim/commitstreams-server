const { routes } = require('./api');

const defineRoutes = (expressRouter) => {
  expressRouter.use('/roles', routes());
};

module.exports = defineRoutes;
