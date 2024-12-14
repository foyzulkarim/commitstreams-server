const config = require('./configs');
const { connectWithMongoDb } = require('./libraries/db');
const fs = require("fs");
const path = require("path");
const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    appliedAt: { type: Date, default: Date.now },
});

const Migration = mongoose.model('__migrations__', migrationSchema);


async function runMigrations() {
    await connectWithMongoDb();
    const migrationsDir = path.join(__dirname, "migrations");

    console.log("Starting migration runner...", config.MONGODB_URI, config.DB_NAME);

    try {
        // Get applied migrations from database
        const migrationsHistory = await Migration.find().sort({ appliedAt: 1 });
        const appliedMigrations = migrationsHistory.map(m => m.name);

        console.log("Previously applied migrations:", appliedMigrations);

        const migrationFiles = fs
            .readdirSync(migrationsDir)
            .filter(file => file.endsWith(".js"))
            .sort((a, b) => a.localeCompare(b));

        let version = 0;
        for (const file of migrationFiles) {
            version++;
            if (appliedMigrations.includes(file)) {
                console.log(`Skipping already applied migration: ${file}`);
                continue;
            }

            console.log(`Applying migration: ${file}`);
            const migration = require(path.join(migrationsDir, file));

            if (migration.runMigration) {
                try {
                    await migration.runMigration();
                    await Migration.create({ name: file });
                } catch (err) {
                    console.error(`Error applying migration ${file}:`, err);
                    throw err;
                }
            }
        }

        console.log("Migration runner completed successfully.");
    } catch (error) {
        console.error("Migration runner failed:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

// Run migrations
runMigrations()
    .then(() => {
        console.log("Exiting migration runner");
        process.exit(0);
    })
    .catch(error => {
        console.error("Unhandled error in migration runner:", error);
        process.exit(1);
    }); 
