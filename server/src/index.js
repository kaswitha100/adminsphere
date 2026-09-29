require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const User = require('./models/User');
const { seedDatabase } = require('./scripts/seed');

let mongodInstance = null;

const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/adminsphere';

  console.log(`[AdminSphere] Attempting connection to MongoDB at: ${mongoUri}`);

  // 1. Check if MONGO_URI fails, then use MongoMemoryServer.create() fallback
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[AdminSphere] Connected successfully to external MongoDB at ${mongoUri}`);
  } catch (err) {
    console.warn(`[AdminSphere] Local MongoDB not detected or connection refused: ${err.message}`);
    console.log('[AdminSphere] Initializing mongodb-memory-server fallback...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        binary: {
          version: process.env.MONGOMS_VERSION || '7.0.14'
        },
        instance: {
          dbName: 'adminsphere',
          launchTimeout: 120000
        }
      });
      const memoryUri = mongodInstance.getUri();
      console.log(`[AdminSphere] Embedded mongodb-memory-server instance created at: ${memoryUri}`);

      await mongoose.connect(memoryUri);
      console.log('[AdminSphere] Connected successfully to embedded mongodb-memory-server!');
    } catch (memErr) {
      console.error('[AdminSphere] Fatal error creating MongoMemoryServer:', memErr.message);
      process.exit(1);
    }
  }

  // 2. Auto-seed superadmin@adminsphere.io and demo accounts
  try {
    const superAdmin = await User.findOne({
      $or: [
        { email: 'superadmin@adminsphere.io' },
        { email: 'superadminsphere.io' }
      ]
    });

    if (!superAdmin) {
      console.log('[AdminSphere] superadmin@adminsphere.io not found. Auto-seeding initial database...');
      await seedDatabase(false);
      console.log('[AdminSphere] Auto-seed complete: superadmin@adminsphere.io ready for login!');
    } else {
      console.log('[AdminSphere] superadmin@adminsphere.io account verified in database.');
    }
  } catch (seedErr) {
    console.error('[AdminSphere] Error during auto-seeding:', seedErr.message);
  }

  // 3. Start Express HTTP server
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log('========================================================');
    console.log(`[AdminSphere] Server is actively running on port ${PORT}`);
    console.log(`[AdminSphere] API URL: http://localhost:${PORT}/api/v1`);
    console.log(`[AdminSphere] Super Admin Credentials: superadmin@adminsphere.io | Admin@123456`);
    console.log('========================================================');
  });

  const handleExit = async (signal) => {
    console.log(`\n[AdminSphere] Received ${signal}. Shutting down cleanly...`);
    server.close(async () => {
      await mongoose.disconnect();
      if (mongodInstance) {
        await mongodInstance.stop();
      }
      console.log('[AdminSphere] Shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleExit('SIGTERM'));
  process.on('SIGINT', () => handleExit('SIGINT'));
};

startServer();

module.exports = app;
