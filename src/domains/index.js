const userRoutes = require('./user');
const repositoryRoutes = require('./repository');
const prRoutes = require('./pull');
const roleRoutes = require('./role');
const resourceRoutes = require('./resource');

const defineRoutes = async (expressRouter) => {
  
  userRoutes(expressRouter);
  repositoryRoutes(expressRouter);
  prRoutes(expressRouter);
  roleRoutes(expressRouter);
  resourceRoutes(expressRouter);
};

module.exports = defineRoutes;
