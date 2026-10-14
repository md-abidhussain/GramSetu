import multer from 'multer';

/**
 * Last stop for anything a route did not handle.
 *
 * The cases below are failures the caller caused and can fix, so they are
 * explained. Anything else is a bug or an outage on our side: it is logged in
 * full and answered with one sentence, because the message on an unexpected
 * error tends to name a database, a file path or a query, and none of that is
 * the caller's business.
 */
export const errorHandler = (err, req, res, next) => {
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. The limit is 5MB for images and 10MB for PDFs.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Please upload one file at a time.' });
    }
    return res.status(400).json({ message: 'That file could not be uploaded.' });
  }

  if (typeof err.message === 'string' && err.message.startsWith('Invalid file type.')) {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({ message: `Validation error: ${messages.join(', ')}` });
  }

  // A bad id reaching a query. validateIdParam catches these on path
  // parameters; this covers ids arriving in a body.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'That request referred to something that does not exist.' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    return res.status(400).json({ message: `That ${field} is already registered.` });
  }

  // Errors a route raised on purpose carry a status. Anything without one is
  // unexpected, so the client is told nothing beyond that it failed.
  const status = err.status || err.statusCode;
  if (status && status < 500) {
    return res.status(status).json({ message: err.message || 'That request could not be completed.' });
  }

  res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
};
