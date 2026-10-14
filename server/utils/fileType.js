// What a file actually is, read from its first bytes.
//
// multer only sees the content type the browser claims, and a caller writing
// their own request can claim anything. These signatures are the formats the
// app sends on to Cloudinary and the PDF parser, so they are the formats worth
// accepting.

const startsWith = (buffer, bytes) =>
  buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte);

const SIGNATURES = [
  { type: 'image/jpeg', matches: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  { type: 'image/png', matches: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { type: 'image/gif', matches: (b) => startsWith(b, [0x47, 0x49, 0x46, 0x38]) },
  {
    type: 'image/webp',
    // RIFF....WEBP - the four bytes in between are the file length.
    matches: (b) =>
      startsWith(b, [0x52, 0x49, 0x46, 0x46]) &&
      b.length >= 12 &&
      b.subarray(8, 12).toString('latin1') === 'WEBP'
  },
  { type: 'application/pdf', matches: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46]) }
];

export const detectFileType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return null;
  }
  return SIGNATURES.find((signature) => signature.matches(buffer))?.type ?? null;
};

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const PDF_TYPES = ['application/pdf'];

export const isAllowedType = (buffer, allowed) => {
  const detected = detectFileType(buffer);
  return detected !== null && allowed.includes(detected);
};
