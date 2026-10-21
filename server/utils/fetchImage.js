import { detectFileType, IMAGE_TYPES } from './fileType.js';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Downloads an image we previously stored (Cloudinary, or a seeded URL) with a
 * timeout and a size cap, and checks it really is an image. Throws an error
 * carrying `status: 502`, whose message is safe to show.
 */
export const fetchImage = async (url, { timeoutMs = 15_000 } = {}) => {
  const fail = (detail) => {
    const error = new Error('A stored photo could not be loaded.');
    error.status = 502;
    error.detail = detail;
    return error;
  };

  // https only, except plain-http localhost while developing with local file storage.
  const localDevUrl = process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url ?? '');
  if (typeof url !== 'string' || (!/^https:\/\//i.test(url) && !localDevUrl)) throw fail('not an https url');

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' });
  } catch (error) {
    throw fail(error.name === 'TimeoutError' ? 'timeout' : 'network');
  }
  if (!response.ok) throw fail(`http ${response.status}`);

  const declared = Number(response.headers.get('content-length'));
  if (declared > MAX_IMAGE_BYTES) throw fail('too large');

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) throw fail('too large');

  const mimeType = detectFileType(buffer);
  if (!mimeType || !IMAGE_TYPES.includes(mimeType)) throw fail('not an image');

  return { buffer, mimeType };
};

export const toInlinePart = ({ buffer, mimeType }) => ({
  inlineData: { data: buffer.toString('base64'), mimeType }
});
