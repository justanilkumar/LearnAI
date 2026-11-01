const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnify';
  
  try {
    // Attempt connecting to the provided MongoDB URI (local daemon or Atlas)
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500 // Fast failover if local daemon is not running
    });
    console.log(`✅ [MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`⚠️ [MongoDB Warning]: Could not connect to external/local MongoDB at ${uri} (${err.message}).`);
    console.log(`🚀 [Auto-Fallback]: Initializing embedded MongoDB Memory Server for zero-friction local development...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'learnify'
        }
      });
      const memoryUri = memoryServer.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ [Embedded MongoDB Connected]: In-Memory instance running at ${memoryUri}`);
      
      // Auto seed if running in-memory
      const { seedDatabase } = require('../seeds/seedData');
      await seedDatabase({ silent: true });
      console.log(`🌱 [Auto-Seeded]: In-memory database populated with sample courses, users, and enrollments.`);
      
      return conn;
    } catch (memErr) {
      console.error(`❌ [MongoDB Error]: Failed to start in-memory database:`, memErr);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
