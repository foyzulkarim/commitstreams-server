const Resource = require('../domains/resource/schema');

const data = {
  resources: [
    // Resources
    {
      label: 'Search Resources',
      type: 'api',
      identifier: '/api/v1/resources/search',
      module: 'resources',
    },
    {
      label: 'Count Resources',
      type: 'api',
      identifier: '/api/v1/resources/count',
      module: 'resources',
    },
    {
      label: 'Get Resource',
      type: 'api',
      identifier: '/api/v1/resources/:id',
      module: 'resources',
    },
    // Roles
    {
      label: 'Search Roles',
      type: 'api',
      identifier: '/api/v1/roles/search',
      module: 'roles',
    },
    {
      label: 'Count Roles',
      type: 'api',
      identifier: '/api/v1/roles/count',
      module: 'roles',
    },
    {
      label: 'Get Role',
      type: 'api',
      identifier: '/api/v1/roles/:id',
      module: 'roles',
    },
    // Users
    {
      label: 'Search Users',
      type: 'api',
      identifier: '/api/v1/users/search',
      module: 'users',
    },
    {
      label: 'Count Users',
      type: 'api',
      identifier: '/api/v1/users/count',
      module: 'users',
    },
    {
      label: 'Get User',
      type: 'api',
      identifier: '/api/v1/users/detail/:id',
      module: 'users',
    },
    {
      label: 'Delete User',
      type: 'api',
      identifier: '/api/v1/users/remove/:id',
      module: 'users',
    },
    {
      label: 'Activate User',
      type: 'api',
      identifier: '/api/v1/users/activate/:id',
      module: 'users',
    },
    // Pull Requests
    {
      label: 'Search Pull Requests',
      type: 'api',
      identifier: '/api/v1/pulls/search',
      module: 'pulls',
    },
    {
      label: 'Count Pull Requests',
      type: 'api',
      identifier: '/api/v1/pulls/count',
      module: 'pulls',
    },
    {
      label: 'Fetch Pull Request Updates',
      type: 'api',
      identifier: '/api/v1/pulls/fetch-updates',
      module: 'pulls',
    },
    {
      label: 'Get Pull Request',
      type: 'api',
      identifier: '/api/v1/pulls/:id',
      module: 'pulls',
    },
    // Repositories
    {
      label: 'Search Repositories',
      type: 'api',
      identifier: '/api/v1/repositories/search',
      module: 'repositories',
    },
    {
      label: 'Count Repositories',
      type: 'api',
      identifier: '/api/v1/repositories/count',
      module: 'repositories',
    },
    {
      label: 'Search Single Repository',
      type: 'api',
      identifier: '/api/v1/repositories/search-one',
      module: 'repositories',
    },
    {
      label: 'Fetch From GitHub',
      type: 'api',
      identifier: '/api/v1/repositories/fetch-from-github',
      module: 'repositories',
    },
    {
      label: 'Follow Repository',
      type: 'api',
      identifier: '/api/v1/repositories/follow/:id',
      module: 'repositories',
    },
    {
      label: 'Get Repository',
      type: 'api',
      identifier: '/api/v1/repositories/:id',
      module: 'repositories',
    },
    {
      label: 'Show roles sidebar',
      type: 'client',
      identifier: 'sidebar-roles',
      module: 'roles',
    },
    // sidebar-users
    {
      label: 'Show users sidebar',
      type: 'client',
      identifier: 'sidebar-users',
      module: 'users',
    },
  ],
};

async function insertResource(resource) {
  try {
    // check if resource already exists by identifier
    const existingResource = await Resource.findOne({
      identifier: resource.identifier,
    });
    if (existingResource) {
      console.log(`Resource already exists: ${resource.identifier}`);
      return;
    }
    const result = await Resource.create(resource);
    console.log(`Inserted resource: ${resource._id}`);
    return result;
  } catch (error) {
    console.error(`Error inserting resource ${resource.id}:`, error);
    throw error;
  }
}

async function runMigration() {
  console.log('Running migration: 001-add-initial-resources');

  try {
    for (const resource of data.resources) {
      await insertResource(resource);
    }
    console.log('Successfully completed migration 001');
  } catch (error) {
    console.error('Failed to complete migration 001:', error);
    throw error;
  }
}

module.exports = { runMigration };
