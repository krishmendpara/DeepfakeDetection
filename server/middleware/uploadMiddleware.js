const multer = require('multer');
const path = require('path');

// In-memory storage: do NOT save uploaded files to local disk (server/uploads)
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const allowedExtensions = /jpg|jpeg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = (file.mimetype || '').toLowerCase();

  const isExtValid = allowedExtensions.test(ext);
  const isMimeValid =
    mime === 'image/jpeg' ||
    mime === 'image/jpg' ||
    mime === 'image/png' ||
    mime === 'image/webp' ||
    mime.startsWith('image/');

  if (isExtValid && isMimeValid) {
    return cb(null, true);
  }

  const err = new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP image files are allowed.');
  err.code = 'INVALID_FILE_TYPE';
  return cb(err);
}

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum limit
  },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;
