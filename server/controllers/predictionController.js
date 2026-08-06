const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const Prediction = require('../models/Prediction');

// @desc    Analyze uploaded image
// @route   POST /api/prediction/analyze
// @access  Private
const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000/predict';

    // Prepare multipart form data for FastAPI
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.filename,
      contentType: req.file.mimetype,
    });

    // Send request to Python inference service
    const response = await axios.post(mlServiceUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    const { label, confidence } = response.data;

    // Construct image URL to be served statically
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Save prediction in database
    const prediction = await Prediction.create({
      user: req.user._id,
      imageUrl,
      result: label, // "real" or "fake"
      confidence,    // 0-100
    });

    res.status(201).json({
      _id: prediction._id,
      result: prediction.result,
      confidence: prediction.confidence,
      imageUrl: prediction.imageUrl,
      createdAt: prediction.createdAt,
    });
  } catch (error) {
    console.error('Prediction analysis failed:', error.message);
    res.status(500).json({
      message: 'Inference service error. Make sure the ML service is running.',
      error: error.message,
    });
  }
};

const getPredictionHistory = async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a prediction from history
// @route   DELETE /api/prediction/:id
// @access  Private
const deletePrediction = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    if (prediction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await Prediction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  analyzeImage,
  getPredictionHistory,
  deletePrediction,
};
