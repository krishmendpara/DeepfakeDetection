const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const { Readable } = require('stream');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary from environment variables if present
const isCloudinaryConfigured = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return Boolean(
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_API_SECRET &&
    CLOUDINARY_CLOUD_NAME.trim() !== '' &&
    CLOUDINARY_API_KEY.trim() !== '' &&
    CLOUDINARY_API_SECRET.trim() !== '' &&
    CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    CLOUDINARY_CLOUD_NAME !== 'placeholder'
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// GridFS bucket instance getter
let gridFSBucket = null;
const getGridFSBucket = () => {
  if (gridFSBucket) return gridFSBucket;
  if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'media',
    });
    return gridFSBucket;
  }
  return null;
};

// Upload in-memory buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder = 'deepfake-detection', publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'image',
    };
    if (publicId) uploadOptions.public_id = publicId;

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        provider: 'cloudinary',
      });
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// Upload in-memory buffer to MongoDB GridFS
const uploadBufferToGridFS = (buffer, filename, contentType = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    if (!bucket) {
      return reject(new Error('MongoDB GridFS is not initialized or connected'));
    }

    const safeFilename = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(filename) || '.jpg'}`;
    const uploadStream = bucket.openUploadStream(safeFilename, {
      contentType,
      metadata: {
        originalName: filename,
        uploadedAt: new Date(),
      },
    });

    uploadStream.on('error', (err) => reject(err));
    uploadStream.on('finish', (file) => {
      resolve({
        url: `/api/media/${file._id.toString()}`,
        publicId: file._id.toString(),
        id: file._id.toString(),
        provider: 'gridfs',
      });
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// Unified upload function
const uploadImage = async ({ buffer, filename = 'image.jpg', mimetype = 'image/jpeg', folder = 'deepfake-detection' }) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Valid image buffer is required for upload');
  }

  // 1. Try Cloudinary if credentials are configured
  if (isCloudinaryConfigured()) {
    try {
      const cleanBase = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, '_');
      const publicId = `${cleanBase}-${Date.now()}`;
      return await uploadBufferToCloudinary(buffer, folder, publicId);
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to GridFS:', err.message);
    }
  }

  // 2. Fallback to MongoDB GridFS in remote database
  return await uploadBufferToGridFS(buffer, filename, mimetype);
};

// Upload a Base64 string directly to storage
const uploadBase64Image = async (base64String, folder = 'deepfake-detection', prefix = 'overlay') => {
  if (!base64String) return null;
  try {
    const cleanBase64 = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const filename = `${prefix}-${Date.now()}.png`;
    return await uploadImage({
      buffer,
      filename,
      mimetype: 'image/png',
      folder,
    });
  } catch (err) {
    console.error(`Failed to upload base64 image (${prefix}):`, err.message);
    return null;
  }
};

// Delete image from Cloudinary or GridFS or legacy local uploads
const deleteImage = async ({ url, publicId, provider }) => {
  try {
    // 1. Cloudinary deletion
    if (publicId && (provider === 'cloudinary' || (url && url.includes('cloudinary.com')))) {
      if (isCloudinaryConfigured()) {
        await cloudinary.uploader.destroy(publicId);
      }
      return true;
    }

    // 2. GridFS deletion
    const isGridFS = provider === 'gridfs' || (url && url.includes('/api/media/'));
    if (isGridFS) {
      const fileId = publicId || (url ? url.split('/api/media/')[1] : null);
      if (fileId && mongoose.Types.ObjectId.isValid(fileId)) {
        const bucket = getGridFSBucket();
        if (bucket) {
          await bucket.delete(new mongoose.Types.ObjectId(fileId));
        }
      }
      return true;
    }

    // 3. Fallback: Clean up legacy local file in server/uploads if URL refers to local
    if (url && (url.includes('/uploads/') || !url.startsWith('http'))) {
      const filename = path.basename(url);
      const localPath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
        } catch (e) {
          // ignore
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Error deleting image from storage:', err.message);
    return false;
  }
};

module.exports = {
  isCloudinaryConfigured,
  getGridFSBucket,
  uploadImage,
  uploadBase64Image,
  deleteImage,
};
