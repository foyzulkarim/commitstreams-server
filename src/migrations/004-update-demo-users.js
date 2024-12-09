const User = require('../domains/user/schema');
const bcrypt = require('bcrypt');

async function runMigration() {
  console.log("Running migration: 004-update-demo-users");
  const salt = await bcrypt.genSalt(10);

  const adminUser = await User.findOne({ email: 'admin@example.com' });
  const visitorUser = await User.findOne({ email: 'visitor@example.com' });

  if (adminUser) {
    adminUser.local.password = await bcrypt.hash('password', salt);
    await adminUser.save();
  } else {
    const adminUser = {
      email: 'admin@example.com',
      displayName: 'Admin User',
      authType: 'local',
      local: {
        username: 'admin@example.com',
        password: await bcrypt.hash('password', salt),
      },
      isDemo: false,
      isVerified: true,
      isAdmin: true,
      role: 'admin'
    };
    const result = await User.create(adminUser);
    console.log(`Inserted ${adminUser.displayName}: ${result._id}`);
  }

  if (visitorUser) {
    visitorUser.local.password = await bcrypt.hash('password', salt);
    await visitorUser.save();
  } else {
    const visitorUser = {
      email: 'visitor@example.com',
      displayName: 'Visitor User',
      authType: 'local',
      local: {
        username: 'visitor@example.com',
        password: await bcrypt.hash('password', salt),
      },
      isDemo: false,
      isVerified: true,
      isAdmin: false,
      role: 'visitor'
    };

    const result = await User.create(visitorUser);
    console.log(`Inserted ${visitorUser.displayName}: ${result._id}`);
  }

  console.log("Successfully completed migration 004");
}

module.exports = {
  runMigration
};
