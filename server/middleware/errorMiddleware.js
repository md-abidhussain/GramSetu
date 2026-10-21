import multer from 'multer';
import { logger } from '../utils/logger.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'That API route does not exist.' });
};

// Failures the caller caused are explained. Anything else is logged and
// answered with one sentence, because an unexpected error's message tends to
// name a database, a path or a query.
export const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File is too large. The limit is 5MB for images and 10MB for PDFs.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Please upload one file at a time.' });
    }
    return res.status(400).json({ message: 'That file could not be uploaded.' });
  }

  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'The request is too large.' });
  }

  if (typeof err.message === 'string' && err.message.startsWith('Invalid file type.')) {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({ message: `Validation error: ${messages.join(', ')}` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'That request referred to something that does not exist.' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'That record already exists.' });
  }

  const status = err.status || err.statusCode;
  if (status && status < 500) {
    return res.status(status).json({ message: err.message || 'That request could not be completed.' });
  }

  logger.error('unhandled error', { requestId: req.id, method: req.method, path: req.originalUrl.split('?')[0], error: err, stack: err.stack });
  const body = { message: 'Something went wrong on the server. Please try again.' };
  if (status === 503) body.message = err.message || 'A service this request depends on is unavailable.';
  if (req.id) body.requestId = req.id;
  res.status(status && status >= 500 ? status : 500).json(body);
};
