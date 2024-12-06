const Model = require('../domains/role/schema');

const data = {
  "roles": [
    {
      "name": "Super admin",
      "identifier": "superadmin",
      "isSystemManaged": true,
      "permissions": {
        "api": [
          "/api/*"
        ],
        "client": []
      }
    },
    {
      "name": "Admin",
      "identifier": "admin",
      "isSystemManaged": true,
      "permissions": {
        "api": [
          "/api/v1/*",
          "/api/users/search",
          "/api/users/count",
          "/api/users/detail/:id"
        ],
        "client": []
      }
    },
    {
      "name": "Visitor",
      "identifier": "visitor",
      "isSystemManaged": true,
      "permissions": {
        "api": [
          "/api/v1/*"
        ],
        "client": []
      }
    }
  ]
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
    console.log(`Inserted role: ${item._id}`);
    return result;
  } catch (error) {
    console.error(`Error inserting role ${item._id}:`, error);
    throw error;
  }
}

async function runMigration() {
  console.log("Running migration: 002-add-roles-permissions");

  try {
    for (const role of data.roles) {
      await insert(role);
    }
    console.log("Successfully completed migration 002");
  } catch (error) {
    console.error("Failed to complete migration 002:", error);
    throw error;
  }
}

module.exports = { runMigration }; 
