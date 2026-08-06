const express = require('express');
const { analyzeImage, getPredictionHistory, deletePrediction } = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/analyze', protect, upload.single('image'), analyzeImage);
router.get('/history', protect, getPredictionHistory);
router.delete('/:id', protect, deletePrediction);

module.exports = router;
