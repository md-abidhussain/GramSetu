import pdf from 'pdf-parse';

export const extractTextFromPdf = async (buffer) => {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file buffer provided');
    }
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};
