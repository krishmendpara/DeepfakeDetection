const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  result: {
    type: String,
    enum: ['real', 'fake'],
    required: true,
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
  heatmapBase64: {
    type: String,
  },
  faceCropUrl: {
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
