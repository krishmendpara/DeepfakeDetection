const express = require('express');
const {
  analyzeImage,
  getPredictionHistory,
  getPredictionById,
  deletePrediction,
  deleteMultiplePredictions,
} = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Analysis routes
router.post('/analyze', protect, upload.single('image'), analyzeImage);
router.post('/detect', protect, upload.single('image'), analyzeImage);

// History routes
router.get('/history', protect, getPredictionHistory);
router.get('/history/:id', protect, getPredictionById);
router.delete('/history/batch', protect, deleteMultiplePredictions);
router.post('/history/batch-delete', protect, deleteMultiplePredictions);
router.delete('/history/:id', protect, deletePrediction);

// Batch delete routes
router.delete('/batch', protect, deleteMultiplePredictions);
router.post('/batch-delete', protect, deleteMultiplePredictions);

// Direct ID routes
router.get('/:id', protect, getPredictionById);
router.delete('/:id', protect, deletePrediction);

module.exports = router;
