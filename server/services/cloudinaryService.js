import { v2 as cloudinary } from 'cloudinary';
import { stripImageMetadata } from '../utils/stripImageMetadata.js';
import { logger } from '../utils/logger.js';

let configured = false;
const ensureConfigured = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const error = new Error('File storage is not configured on this server.');
    error.status = 503;
    throw error;
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    configured = true;
  }
};

let testStore = null;
/** Tests swap storage for an in-memory fake so no real uploads happen. */
export const __setStorageForTests = (store) => {
  testStore = store;
};

/**
 * Stores a file and returns { url, publicId }. Images have EXIF/GPS metadata
 * removed first.
 */
export const storeFile = async ({ buffer, mimetype }, folder) => {
  const body = mimetype?.startsWith('image/') ? stripImageMetadata(buffer, mimetype) : buffer;
  if (testStore) return testStore.upload(body, folder, mimetype);

  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `gramsetu/${folder}`, resource_type: mimetype === 'application/pdf' ? 'raw' : 'image' },
      (error, result) => {
        if (error) {
          logger.error('file storage upload failed', { folder, error: error.message });
          const failure = new Error('The file could not be stored. Please try again.');
          failure.status = 502;
          return reject(failure);
        }
        resolve({ url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type });
      }
    );
    stream.end(body);
  });
};

/** Best effort: used to clean up after a request that failed after uploading. */
export const removeStoredFile = async (stored) => {
  if (!stored?.publicId) return;
  try {
    if (testStore) return await testStore.remove(stored.publicId);
    ensureConfigured();
    await cloudinary.uploader.destroy(stored.publicId, { resource_type: stored.resourceType || 'image' });
  } catch (error) {
    logger.warn('could not remove orphaned upload', { error: error.message });
  }
};
