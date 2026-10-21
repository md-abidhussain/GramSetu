// Phone photos carry EXIF metadata: exact GPS position, device model, time.
// Uploaded photos are stored at public (unguessable) URLs, so the metadata is
// removed first. Pixels are untouched. JPEG and PNG are handled; WebP and GIF
// are passed through unchanged (documented in docs/SECURITY.md).

const JPEG_METADATA_MARKERS = new Set([0xe1, 0xed]); // APP1 (EXIF/XMP), APP13 (IPTC)

const stripJpeg = (buffer) => {
  const kept = [buffer.subarray(0, 2)]; // SOI
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) return buffer; // not a well-formed marker: leave untouched
    const marker = buffer[offset + 1];
    if (marker === 0xda) {
      // Start of scan: the compressed image follows; keep everything from here.
      kept.push(buffer.subarray(offset));
      return Buffer.concat(kept);
    }
    const length = buffer.readUInt16BE(offset + 2);
    const end = offset + 2 + length;
    if (length < 2 || end > buffer.length) return buffer;
    if (!JPEG_METADATA_MARKERS.has(marker)) kept.push(buffer.subarray(offset, end));
    offset = end;
  }
  return buffer;
};

const PNG_METADATA_CHUNKS = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt']);

const stripPng = (buffer) => {
  const kept = [buffer.subarray(0, 8)];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('latin1');
    const end = offset + 12 + length;
    if (end > buffer.length) return buffer;
    if (!PNG_METADATA_CHUNKS.has(type)) kept.push(buffer.subarray(offset, end));
    offset = end;
    if (type === 'IEND') break;
  }
  return Buffer.concat(kept);
};

export const stripImageMetadata = (buffer, mimeType) => {
  try {
    if (mimeType === 'image/jpeg') return stripJpeg(buffer);
    if (mimeType === 'image/png') return stripPng(buffer);
  } catch {
    // A malformed file is returned as-is; the signature check already ran.
  }
  return buffer;
};
