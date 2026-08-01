import cloudinary from '../config/cloudinary.js';

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<object>} Cloudinary response object
 */
export const uploadBuffer = (buffer, folder = 'gramsetu') => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error('No file buffer provided for Cloudinary upload'));
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};
