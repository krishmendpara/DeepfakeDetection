const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  imageUrl: {
    type: String,
    required: true,
  },
  originalImageUrl: {
    type: String,
  },
  imagePublicId: {
    type: String,
  },
  result: {
    type: String,
    enum: ['real', 'fake'],
    required: true,
  },
  label: {
    type: String,
  },
  confidence: {
    type: Number,
    required: true,
  },
  displayLabel: {
    type: String,
  },
  explanations: [
    {
      concept: { type: String },
      relevance_pct: { type: Number },
    },
  ],
  heatmapUrl: {
    type: String,
  },
  heatmapPublicId: {
    type: String,
  },
  faceCropUrl: {
    type: String,
  },
  faceCropPublicId: {
    type: String,
  },
  storageProvider: {
    type: String,
    enum: ['cloudinary', 'gridfs', 'local'],
    default: 'cloudinary',
  },
  // Legacy optional fields kept for backwards-compatibility when reading older records
  heatmapBase64: {
    type: String,
  },
  faceCropBase64: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Prediction', PredictionSchema);
