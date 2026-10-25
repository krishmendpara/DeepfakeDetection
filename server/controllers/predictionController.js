const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const Prediction = require('../models/Prediction');

// Helper to save base64 image data to server/uploads
const saveBase64ToFile = (base64String, prefix = 'heatmap') => {
  if (!base64String) return null;
  try {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    return filename;
  } catch (err) {
    console.error(`Error saving ${prefix} file:`, err.message);
    return null;
  }
};

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
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const {
      label,
      confidence,
      display_label,
      explanations,
      heatmap_base64,
      face_crop_base64
    } = response.data;

    // Save heatmap as file in uploads if present
    const heatmapFilename = saveBase64ToFile(heatmap_base64, 'heatmap');
    const heatmapUrl = heatmapFilename
      ? `${req.protocol}://${req.get('host')}/uploads/${heatmapFilename}`
      : null;

    // Save face crop as file in uploads if present
    const cropFilename = saveBase64ToFile(face_crop_base64, 'crop');
    const faceCropUrl = cropFilename
      ? `${req.protocol}://${req.get('host')}/uploads/${cropFilename}`
      : null;

    // Normalize result to enum ['real', 'fake']
    const normalizedResult = (label === 'fake' || label === 'AI-Generated') ? 'fake' : 'real';

    // Construct image URL to be served statically
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Save prediction in database with optional XAI fields
    const predictionData = {
      user: req.user._id,
      imageUrl,
      result: normalizedResult,
      confidence,
    };

    if (display_label) predictionData.displayLabel = display_label;
    if (Array.isArray(explanations)) predictionData.explanations = explanations;
    if (heatmapUrl) predictionData.heatmapUrl = heatmapUrl;
    if (faceCropUrl) predictionData.faceCropUrl = faceCropUrl;

    const prediction = await Prediction.create(predictionData);

    res.status(201).json({
      _id: prediction._id,
      result: prediction.result,
      confidence: prediction.confidence,
      imageUrl: prediction.imageUrl,
      createdAt: prediction.createdAt,
      displayLabel: prediction.displayLabel || (prediction.result === 'fake' ? 'AI-Generated' : 'Real Photo'),
      explanations: prediction.explanations || [],
      heatmapUrl: prediction.heatmapUrl || null,
      heatmap_base64: heatmap_base64 || null,
      faceCropUrl: prediction.faceCropUrl || null,
      face_crop_base64: face_crop_base64 || null,
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

    // Clean up uploaded files if they exist
    if (prediction.imageUrl) {
      const imgFilename = path.basename(prediction.imageUrl);
      const imgPath = path.join(__dirname, '..', 'uploads', imgFilename);
      if (fs.existsSync(imgPath)) {
        try { fs.unlinkSync(imgPath); } catch (e) { /* ignore */ }
      }
    }
    if (prediction.heatmapUrl) {
      const hFilename = path.basename(prediction.heatmapUrl);
      const hPath = path.join(__dirname, '..', 'uploads', hFilename);
      if (fs.existsSync(hPath)) {
        try { fs.unlinkSync(hPath); } catch (e) { /* ignore */ }
      }
    }
    if (prediction.faceCropUrl) {
      const cFilename = path.basename(prediction.faceCropUrl);
      const cPath = path.join(__dirname, '..', 'uploads', cFilename);
      if (fs.existsSync(cPath)) {
        try { fs.unlinkSync(cPath); } catch (e) { /* ignore */ }
      }
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
