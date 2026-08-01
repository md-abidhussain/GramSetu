import multer from 'multer';

export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  // Multer specific errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Limit is 5MB for images and 10MB for PDFs.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  // Handle errors thrown explicitly as file validation
  if (err.message && (err.message.includes('Invalid file type') || err.message.includes('Only PDF') || err.message.includes('Only images'))) {
    return res.status(400).json({ message: err.message });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: `Validation error: ${messages.join(', ')}` });
  }

  // Duplicate key errors
  if (err.code === 11000) {
    const key = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `Duplicate value for field: ${key}. Please use a unique value.` });
  }

  // Default response
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error occurred.'
  });
};
