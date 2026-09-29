const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/adminsphere';

  try {
    console.log(`[AdminSphere] Attempting connection to MongoDB at: ${uri}`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[AdminSphere] MongoDB connected successfully to: ${conn.connection.host}`);
    return conn;
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

      const conn = await mongoose.connect(memoryUri);
      console.log('[AdminSphere] Connected successfully to embedded mongodb-memory-server!');
      return conn;
    } catch (memErr) {
      console.error('[AdminSphere] Failed to initialize embedded MongoDB engine:', memErr.message);
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log('[AdminSphere] MongoDB disconnected cleanly');
  } catch (err) {
    console.error('[AdminSphere] Error disconnecting MongoDB:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
