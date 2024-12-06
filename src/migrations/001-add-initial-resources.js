const Resource = require('../domains/resource/schema');

const data = {
  "resources": [
    {
      "label": "Search Users",
      "type": "api",
      "identifier": "/api/users/search",
      "module": "users"
    },
    {
      "label": "Count Users",
      "type": "api",
      "identifier": "/api/users/count",
      "module": "users"
    },
    {
      "label": "Get User",
      "type": "api",
      "identifier": "/api/users/detail/:id",
      "module": "users"
    },
    {
      "label": "Delete User",
      "type": "api",
      "identifier": "/api/users/remove/:id",
      "module": "users"
    },
    {
      "label": "Activate User",
      "type": "api",
      "identifier": "/api/users/activate/:id",
      "module": "users"
    }
  ]
};


async function insertResource(resource) {
  try {
    // check if resource already exists by identifier
    const existingResource = await Resource.findOne({ identifier: resource.identifier });
    if (existingResource) {
      console.log(`Resource already exists: ${resource.identifier}`);
      return;
    }
    const result = await Resource.create(resource);
    console.log(`Inserted resource: ${resource.id}`);
    return result;
  } catch (error) {
    console.error(`Error inserting resource ${resource.id}:`, error);
    throw error;
  }
}

async function runMigration() {
  console.log("Running migration: 001-add-initial-resources");

  try {
    for (const resource of data.resources) {
      await insertResource(resource);
    }
    console.log("Successfully completed migration 001");
  } catch (error) {
    console.error("Failed to complete migration 001:", error);
    throw error;
  }
}

module.exports = { runMigration }; 
