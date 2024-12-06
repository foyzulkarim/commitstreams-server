const User = require('../domains/user/schema');
const bcrypt = require('bcrypt');
const config = require('../configs');

async function insert(user) {
  try {
    // check if user already exists by email
    const exists = await User.findOne({ email: user.email });
    if (exists) {
      console.log(`${user.displayName} already exists: ${user.email}`);
      return;
    }
    const result = await User.create(user);
    console.log(`Inserted ${user.displayName}: ${result._id}`);
    return result;
  } catch (error) {
    console.error(`Error inserting ${user.displayName}:`, error);
    throw error;
  }
}

async function runMigration() {
  console.log("Running migration: 003-add-users");

  try {
    if (!config.SUPERADMIN_PASSWORD || !config.SUPERADMIN_EMAIL) {
      throw new Error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables are required');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(config.SUPERADMIN_PASSWORD, salt);

    const superAdminUser = {
      email: config.SUPERADMIN_EMAIL,
      displayName: 'Super Administrator',
      authType: 'local',
      local: {
        username: config.SUPERADMIN_EMAIL,
        password: hashedPassword,
      },
      isDemo: false,
      isVerified: true,
      isAdmin: true,
      isSuperAdmin: true,
      roles: ['superadmin']
    };

    await insert(superAdminUser);

    const adminUser = {
      email: 'admin@example.com',
      displayName: 'Admin User',
      authType: 'local',
      local: {
        username: 'admin@example.com',
        password: 'password', // sample password for demo purposes
      },
      isDemo: false,
      isVerified: true,
      isAdmin: true,
      roles: ['admin']
    };

    await insert(adminUser);

    const visitorUser = {
      email: 'visitor@example.com',
      displayName: 'Visitor User',
      authType: 'local',
      local: {
        username: 'visitor@example.com',
        password: 'password', // sample password for demo purposes
      },
      isDemo: false,
      isVerified: true,
      isAdmin: false,
      roles: ['visitor']
    };

    await insert(visitorUser);

    console.log("Successfully completed migration 003");
  } catch (error) {
    console.error("Failed to complete migration 003:", error);
    throw error;
  }
}

module.exports = { runMigration }; 
