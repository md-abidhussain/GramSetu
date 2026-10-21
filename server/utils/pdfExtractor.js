// The library's index file runs a self-test when it thinks it is the main
// module; importing the implementation directly avoids that.
import pdf from 'pdf-parse/lib/pdf-parse.js';

export const MAX_PDF_PAGES = 60;

/**
 * Extracts text from an uploaded PDF. A file the parser cannot read is the
 * caller's problem (status 400), not a server fault.
 */
export const extractTextFromPdf = async (buffer) => {
  const unreadable = (message) => {
    const error = new Error(message);
    error.status = 400;
    return error;
  };

  if (!buffer || buffer.length === 0) throw unreadable('The PDF is empty.');

  let data;
  try {
    data = await pdf(buffer, { max: MAX_PDF_PAGES });
  } catch {
    throw unreadable('That PDF could not be read. It may be damaged or password protected.');
  }

  const text = (data.text || '').split('\u0000').join('').trim();
  if (!text) {
    throw unreadable('No text could be found in this PDF. Scanned documents need to be run through OCR first.');
  }
  return { text, pages: data.numpages, pagesRead: Math.min(data.numpages, MAX_PDF_PAGES) };
};
