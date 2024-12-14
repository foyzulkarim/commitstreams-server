const { MongoClient } = require('mongodb');


let client = null;

async function getDb(mongodbUri, dbName) {
    console.log("Getting db", mongodbUri, dbName);
    if (!client) {
        client = await MongoClient.connect(mongodbUri);
    }
    return client.db(dbName);
}

async function closeConnection() {
    if (client) {
        await client.close();
        client = null;
    }
}

async function trackMigration({ migrationName, mongodbUri, dbName }) {
    console.log("Tracking migration", migrationName, mongodbUri, dbName);
    const db = await getDb(mongodbUri, dbName);
    const collection = db.collection('__migrations__');

    try {
        await collection.insertOne({
            name: migrationName,
            executedAt: new Date(),
        });
        console.log(`Tracked migration: ${migrationName}`);
    } catch (error) {
        console.error(`Error tracking migration ${migrationName}:`, error);
        throw error;
    }
}

async function getMigrationsHistory({ mongodbUri, dbName }) {
    console.log("Getting migrations history", mongodbUri, dbName);
    const db = await getDb(mongodbUri, dbName);
    const collection = db.collection('__migrations__');

    try {
        return await collection.find({}).toArray();
    } catch (error) {
        console.error('Error fetching migrations history:', error);
        throw error;
    }
}

module.exports = {
    getDb,
    closeConnection,
    trackMigration,
    getMigrationsHistory
}; 
