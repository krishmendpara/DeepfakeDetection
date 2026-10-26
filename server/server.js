require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const {
  analyzeImage,
  getPredictionHistory,
  getPredictionById,
  deletePrediction,
  deleteMultiplePredictions,
  getMediaFile,
} = require('./controllers/predictionController');
const { protect } = require('./middleware/authMiddleware');
const upload = require('./middleware/uploadMiddleware');

// Connect to MongoDB Atlas (with local fallback if offline)
connectDB();

const app = express();

// Configurable CORS to allow other laptops on LAN or custom domain
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve legacy static uploads folder if needed for old scan references
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes: Auth
app.use('/api/auth', authRoutes);

// Routes: Prediction / Detection (/api/prediction/...)
app.use('/api/prediction', predictionRoutes);

// Routes: Direct Step F4 contract endpoints
app.post('/api/detect', protect, upload.single('image'), analyzeImage);
app.get('/api/history', protect, getPredictionHistory);
app.get('/api/history/:id', protect, getPredictionById);
app.delete('/api/history/batch', protect, deleteMultiplePredictions);
app.post('/api/history/batch-delete', protect, deleteMultiplePredictions);
app.delete('/api/history/:id', protect, deletePrediction);

// Media Streaming route for GridFS binary storage
app.get('/api/media/:id', getMediaFile);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    storageProvider: process.env.CLOUDINARY_CLOUD_NAME ? 'Cloudinary (Active)' : 'MongoDB GridFS (Active)',
  });
});

// Multer and Application Error Handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size allowed is 10 MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  if (err.code === 'INVALID_FILE_TYPE' || (err.message && err.message.includes('Invalid file format'))) {
    return res.status(400).json({ message: err.message });
  }

  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (listening on all interfaces)`);
});
