import multer from 'multer';
import { IMAGE_TYPES, PDF_TYPES, detectFileType } from '../utils/fileType.js';

// Files are held in memory because they go straight on to Cloudinary or the
// PDF parser and are never written to disk.
const storage = multer.memoryStorage();

const PDF_SIZE_LIMIT = 10 * 1024 * 1024;
const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;

// multer only knows the content type the caller claims, and a caller writing
// their own request can claim anything. This is the cheap first pass; the real
// check reads the file's own bytes, below.
const claimedTypeFilter = (allowed, label) => (req, file, cb) => {
  if (allowed.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error(`Invalid file type. ${label}`), false);
};

export const uploadTender = multer({
  storage,
  limits: { fileSize: PDF_SIZE_LIMIT, files: 1 },
  fileFilter: claimedTypeFilter(PDF_TYPES, 'Only PDF documents are allowed.')
}).single('file');

export const uploadImage = multer({
  storage,
  limits: { fileSize: IMAGE_SIZE_LIMIT, files: 1 },
  fileFilter: claimedTypeFilter(IMAGE_TYPES, 'Only images are allowed (JPG, PNG, WEBP, GIF).')
}).single('image');

/**
 * Runs after multer and checks what the file really is.
 *
 * A .exe renamed and sent as image/png passes the filter above, because the
 * filter can only read the claim. By this point the bytes are in memory, so the
 * file's own signature can be read instead of trusted.
 */
export const verifyFileContents = (allowed, label) => (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const actual = detectFileType(req.file.buffer);
  if (actual === null || !allowed.includes(actual)) {
    return res.status(400).json({
      message: `That file is not ${label}. Please upload the original file rather than a renamed one.`
    });
  }

  // Later stages read req.file.mimetype, so correct it to what the file is.
  req.file.mimetype = actual;
  next();
};

export const verifyImageContents = verifyFileContents(IMAGE_TYPES, 'an image');
export const verifyPdfContents = verifyFileContents(PDF_TYPES, 'a PDF');
