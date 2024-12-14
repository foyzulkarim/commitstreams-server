const Model = require('../domains/role/schema');
const { ROLES } = require('./constants');

const data = {
  roles: [
    {
      name: ROLES.SUPER_ADMIN,
      identifier: 'superadmin',
      isSystemManaged: true,
      permissions: {
        api: [
          // Users
          '/api/v1/users/search',
          '/api/v1/users/count',
          '/api/v1/users/detail/:id',
          '/api/v1/users/remove/:id',
          '/api/v1/users/activate/:id',
          // Resources
          '/api/v1/resources/search',
          '/api/v1/resources/count',
          '/api/v1/resources/detail/:id',
          // Roles
          '/api/v1/roles/search',
          '/api/v1/roles/count',
          '/api/v1/roles/detail/:id',
        ],
        client: [
          'sidebar-users',
          'sidebar-roles',
        ],
      },
    },
    {
      name: ROLES.ADMIN,
      identifier: 'admin',
      isSystemManaged: true,
      permissions: {
        api: [
          '/api/v1/users/search',
          '/api/v1/users/count',
          '/api/v1/users/detail/:id',
        ],
        client: [
          'sidebar-users',
        ],
      },
    },
    {
      name: ROLES.VISITOR,
      identifier: 'visitor',
      isSystemManaged: true,
      permissions: {
        api: [
          // Pull
          '/api/v1/pulls/search',
          '/api/v1/pulls/count',
          '/api/v1/pulls/detail/:id',
          '/api/v1/pulls/fetch-updates',
          // Repositories
          '/api/v1/repositories/search',
          '/api/v1/repositories/count',
          '/api/v1/repositories/detail/:id',
          '/api/v1/repositories/search-one',
          '/api/v1/repositories/fetch-from-github',
          '/api/v1/repositories/follow/:id',
        ],
        client: [],
      },
    },
  ],
};

async function insert(item) {
  try {
    // check if data already exists by identifier
    const exists = await Model.findOne({ identifier: item.identifier });
    if (exists) {
      console.log(`Role already exists: ${item.identifier}`);
      return;
    }
    const result = await Model.create(item);
    console.log(`Inserted role: ${item.identifier}`);
    return result;
  } catch (error) {
    console.error(`Error inserting role ${item.identifier}:`, error);
    throw error;
  }
}

async function runMigration() {
  console.log('Running migration: 002-add-roles-permissions');

  try {
    for (const role of data.roles) {
      await insert(role);
    }
    console.log('Successfully completed migration 002');
  } catch (error) {
    console.error('Failed to complete migration 002:', error);
    throw error;
  }
}

module.exports = { runMigration };
