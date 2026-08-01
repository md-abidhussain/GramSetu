import multer from 'multer';

// Use memory storage to get buffer directly for Cloudinary/pdf-parse
const storage = multer.memoryStorage();

// File size limits: 10MB for PDF, 5MB for images
const PDF_SIZE_LIMIT = 10 * 1024 * 1024;
const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;

// Filter for PDFs
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF documents are allowed.'), false);
  }
};

// Filter for Images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPG, PNG, WEBP, etc.) are allowed.'), false);
  }
};

export const uploadTender = multer({
  storage,
  limits: { fileSize: PDF_SIZE_LIMIT },
  fileFilter: pdfFilter
}).single('file');

export const uploadImage = multer({
  storage,
  limits: { fileSize: IMAGE_SIZE_LIMIT },
  fileFilter: imageFilter
}).single('image');
