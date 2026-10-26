/**
 * One-time safe data migration script: Local MongoDB -> MongoDB Atlas
 * Safe to re-run multiple times (idempotent upserts, never creates duplicates).
 *
 * Usage:
 *   node server/utils/migrateLocalData.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/ipdProject';
const ATLAS_URI = process.env.MONGO_URI || process.env.MONGO_URL;

async function migrate() {
  console.log('====================================================');
  console.log('  LOCAL TO ATLAS MONGODB DATA MIGRATION SCRIPT      ');
  console.log('====================================================');
  console.log(`Source (Local):      ${LOCAL_URI}`);
  console.log(`Destination (Atlas): ${ATLAS_URI ? ATLAS_URI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@') : 'UNDEFINED'}`);

  if (!ATLAS_URI) {
    console.error('ERROR: MONGO_URI or MONGO_URL must be defined in server/.env');
    process.exit(1);
  }

  let localConn = null;
  let atlasConn = null;

  try {
    console.log('\n[1/4] Connecting to Local MongoDB...');
    localConn = await mongoose.createConnection(LOCAL_URI, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();
    console.log('Connected to Local MongoDB successfully.');

    console.log('\n[2/4] Connecting to MongoDB Atlas...');
    atlasConn = await mongoose.createConnection(ATLAS_URI, {
      serverSelectionTimeoutMS: 8000,
    }).asPromise();
    console.log('Connected to MongoDB Atlas successfully.');

    const localDb = localConn.db;
    const atlasDb = atlasConn.db;

    // --- Migrate Users ---
    console.log('\n[3/4] Migrating Users...');
    const localUsers = await localDb.collection('users').find({}).toArray();
    console.log(`Found ${localUsers.length} user record(s) in local database.`);

    let usersMigrated = 0;
    for (const user of localUsers) {
      // Upsert by email or _id to prevent any duplicate accounts
      await atlasDb.collection('users').updateOne(
        { email: user.email },
        { $setOnInsert: user },
        { upsert: true }
      );
      usersMigrated++;
    }
    console.log(`-> Processed ${usersMigrated} user record(s) into Atlas without duplicates.`);

    // --- Migrate Predictions & History ---
    console.log('\n[4/4] Migrating Analysis History / Predictions...');
    const localPredictions = await localDb.collection('predictions').find({}).toArray();
    console.log(`Found ${localPredictions.length} prediction record(s) in local database.`);

    let predsMigrated = 0;
    for (const pred of localPredictions) {
      // Upsert by _id so re-runs never duplicate scans
      await atlasDb.collection('predictions').updateOne(
        { _id: pred._id },
        { $set: pred },
        { upsert: true }
      );
      predsMigrated++;
    }
    console.log(`-> Processed ${predsMigrated} prediction record(s) into Atlas without duplicates.`);

    console.log('\n====================================================');
    console.log('  MIGRATION COMPLETED SUCCESSFULLY                   ');
    console.log('====================================================');
  } catch (err) {
    console.error('\nMigration encountered an error:', err.message);
  } finally {
    if (localConn) await localConn.close();
    if (atlasConn) await atlasConn.close();
    process.exit(0);
  }
}

migrate();
