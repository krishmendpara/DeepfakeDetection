const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const mongoose = require('mongoose');
const Prediction = require('../models/Prediction');
const storageService = require('../services/storageService');

// @desc    Analyze uploaded image (In-memory buffer -> ML Service -> Remote Storage -> MongoDB)
// @route   POST /api/prediction/analyze OR POST /api/detect
// @access  Private
const analyzeImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000/predict';

    // Safe sanitized filename
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const baseName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = `${baseName}-${Date.now()}${ext}`;

    // 1. Send in-memory buffer to Python FastAPI ML service (Model input & preprocessing unchanged)
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: safeFilename,
      contentType: req.file.mimetype || 'image/jpeg',
    });

    const response = await axios.post(mlServiceUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000,
    });

    const {
      label,
      confidence,
      display_label,
      explanations,
      heatmap_base64,
      face_crop_base64,
    } = response.data;

    // 2. Upload original image buffer to remote storage (Cloudinary or MongoDB Atlas GridFS)
    const originalUpload = await storageService.uploadImage({
      buffer: req.file.buffer,
      filename: safeFilename,
      mimetype: req.file.mimetype,
      folder: 'deepfake-detection/originals',
    });

    // 3. Upload XAI Heatmap to remote storage if available
    let heatmapUpload = null;
    if (heatmap_base64) {
      heatmapUpload = await storageService.uploadBase64Image(
        heatmap_base64,
        'deepfake-detection/heatmaps',
        `heatmap-${Date.now()}`
      );
    }

    // 4. Upload Face Crop to remote storage if available
    let cropUpload = null;
    if (face_crop_base64) {
      cropUpload = await storageService.uploadBase64Image(
        face_crop_base64,
        'deepfake-detection/crops',
        `crop-${Date.now()}`
      );
    }

    // Normalize result enum ['real', 'fake']
    const normalizedResult = (label === 'fake' || label === 'AI-Generated') ? 'fake' : 'real';

    // 5. Construct database record linked to req.user._id (No large base64 stored in MongoDB document)
    const predictionData = {
      user: req.user._id,
      userId: req.user._id,
      imageUrl: originalUpload.url,
      originalImageUrl: originalUpload.url,
      imagePublicId: originalUpload.publicId || originalUpload.id,
      result: normalizedResult,
      label: label || normalizedResult,
      confidence,
      storageProvider: originalUpload.provider,
    };

    if (display_label) predictionData.displayLabel = display_label;
    if (Array.isArray(explanations)) predictionData.explanations = explanations;
    if (heatmapUpload) {
      predictionData.heatmapUrl = heatmapUpload.url;
      predictionData.heatmapPublicId = heatmapUpload.publicId || heatmapUpload.id;
    }
    if (cropUpload) {
      predictionData.faceCropUrl = cropUpload.url;
      predictionData.faceCropPublicId = cropUpload.publicId || cropUpload.id;
    }

    const prediction = await Prediction.create(predictionData);

    // 6. Return response preserving existing contract + remote storage URLs
    res.status(201).json({
      _id: prediction._id,
      result: prediction.result,
      label: prediction.label || prediction.result,
      confidence: prediction.confidence,
      imageUrl: prediction.imageUrl,
      originalImageUrl: prediction.originalImageUrl || prediction.imageUrl,
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
      message: 'Inference service or storage error. Make sure the ML service is running.',
      error: error.message,
    });
  }
};

// @desc    Get prediction history for logged-in user (paginated, newest first)
// @route   GET /api/prediction/history OR GET /api/history
// @access  Private
const getPredictionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0;
    const skip = limit > 0 ? (page - 1) * limit : 0;

    const query = Prediction.find({
      $or: [{ user: req.user._id }, { userId: req.user._id }],
    }).sort({ createdAt: -1 });

    if (limit > 0) {
      query.skip(skip).limit(limit);
    }

    const predictions = await query.exec();

    // Set pagination metadata headers
    const totalCount = await Prediction.countDocuments({
      $or: [{ user: req.user._id }, { userId: req.user._id }],
    });
    res.setHeader('X-Total-Count', totalCount);
    res.setHeader('X-Page', page);
    res.setHeader('X-Limit', limit || totalCount);

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single prediction by ID (only owner can view)
// @route   GET /api/prediction/:id OR GET /api/history/:id
// @access  Private
const getPredictionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const isOwner =
      (prediction.user && prediction.user.toString() === req.user._id.toString()) ||
      (prediction.userId && prediction.userId.toString() === req.user._id.toString());

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to access this record' });
    }

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a prediction from history and remove associated images from storage
// @route   DELETE /api/prediction/:id OR DELETE /api/history/:id
// @access  Private
const deletePrediction = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    const isOwner =
      (prediction.user && prediction.user.toString() === req.user._id.toString()) ||
      (prediction.userId && prediction.userId.toString() === req.user._id.toString());

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this record' });
    }

    // Delete original image from remote storage / Cloudinary / GridFS / local disk
    if (prediction.imageUrl || prediction.imagePublicId) {
      await storageService.deleteImage({
        url: prediction.imageUrl,
        publicId: prediction.imagePublicId,
        provider: prediction.storageProvider,
      });
    }

    // Delete heatmap image from remote storage
    if (prediction.heatmapUrl || prediction.heatmapPublicId) {
      await storageService.deleteImage({
        url: prediction.heatmapUrl,
        publicId: prediction.heatmapPublicId,
        provider: prediction.storageProvider,
      });
    }

    // Delete face crop image from remote storage
    if (prediction.faceCropUrl || prediction.faceCropPublicId) {
      await storageService.deleteImage({
        url: prediction.faceCropUrl,
        publicId: prediction.faceCropPublicId,
        provider: prediction.storageProvider,
      });
    }

    await Prediction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Prediction and stored image(s) deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Batch delete predictions from history and remove associated images from storage
// @route   DELETE /api/history/batch OR POST /api/history/batch-delete
// @access  Private
const deleteMultiplePredictions = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No prediction IDs provided for deletion' });
    }

    // Filter valid ObjectIds
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ message: 'No valid prediction IDs provided' });
    }

    // Find all matching records belonging to the authenticated user
    const predictions = await Prediction.find({
      _id: { $in: validIds },
      $or: [{ user: req.user._id }, { userId: req.user._id }],
    });

    if (predictions.length === 0) {
      return res.status(404).json({ message: 'No matching predictions found to delete' });
    }

    // Delete stored media files in parallel with error tolerance
    await Promise.allSettled(
      predictions.flatMap((pred) => {
        const tasks = [];
        if (pred.imageUrl || pred.imagePublicId) {
          tasks.push(
            storageService.deleteImage({
              url: pred.imageUrl,
              publicId: pred.imagePublicId,
              provider: pred.storageProvider,
            })
          );
        }
        if (pred.heatmapUrl || pred.heatmapPublicId) {
          tasks.push(
            storageService.deleteImage({
              url: pred.heatmapUrl,
              publicId: pred.heatmapPublicId,
              provider: pred.storageProvider,
            })
          );
        }
        if (pred.faceCropUrl || pred.faceCropPublicId) {
          tasks.push(
            storageService.deleteImage({
              url: pred.faceCropUrl,
              publicId: pred.faceCropPublicId,
              provider: pred.storageProvider,
            })
          );
        }
        return tasks;
      })
    );

    const targetIds = predictions.map((p) => p._id);
    await Prediction.deleteMany({ _id: { $in: targetIds } });

    res.json({
      message: `Successfully deleted ${targetIds.length} prediction record(s) and associated media.`,
      deletedCount: targetIds.length,
      deletedIds: targetIds,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Stream GridFS media file
// @route   GET /api/media/:id
// @access  Public
const getMediaFile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid media ID format' });
    }

    const bucket = storageService.getGridFSBucket();
    if (!bucket) {
      return res.status(500).json({ message: 'GridFS storage not connected' });
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const files = await bucket.find({ _id: objectId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Media file not found' });
    }

    const file = files[0];
    res.setHeader('Content-Type', file.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.on('error', () => {
      res.status(404).json({ message: 'Media file could not be read' });
    });
    downloadStream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving media file', error: err.message });
  }
};

module.exports = {
  analyzeImage,
  getPredictionHistory,
  getPredictionById,
  deletePrediction,
  deleteMultiplePredictions,
  getMediaFile,
};
