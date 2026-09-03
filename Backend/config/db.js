const mongoose = require('mongoose');

const connectDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: { version: '1', strict: true, deprecationErrors: true }
    });

    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('✅ Pinged your MongoDB deployment. Connection successful!');

    // Auto-seed initial elections and 4-5 votes if database is currently empty
    try {
      const seedDatabase = require('../seed');
      await seedDatabase(false);
    } catch (seedErr) {
      console.warn('[SEED] Auto-seed note:', seedErr.message);
    }
  } catch (err) {
    // Log the error but do NOT exit the process. Exiting prevents the
    // backend from starting and makes the API unreachable when the DB
    // (e.g. Atlas) is temporarily unreachable. Keep the server running
    // and allow routes to handle DB failures gracefully.
    console.error('MongoDB connection error:', err.message);
    console.warn('Continuing without a successful DB connection. Some routes may fail until the DB is reachable.');
  }
};

module.exports = connectDB;