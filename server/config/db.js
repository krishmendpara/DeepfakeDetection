const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
  try {
    console.log('Connecting to database...');
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection to Atlas failed: ${error.message}`);
    console.log('Falling back to local MongoDB database (mongodb://127.0.0.1:27017/ipdProject)...');
    try {
      const localUrl = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/ipdProject';
      const conn = await mongoose.connect(localUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`Local MongoDB Connected: ${conn.connection.host}`);
    } catch (localError) {
      console.error(`Local MongoDB connection failed: ${localError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
