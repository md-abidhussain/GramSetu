import { callGeminiJson } from './geminiClient.js';

/**
 * Helper to fetch image from URL and convert to Gemini base64 parts
 */
const fetchImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    throw new Error(`Failed to process image from URL ${url}: ${error.message}`);
  }
};

/**
 * Compare before and after images of a project to evaluate completion
 * @param {string} beforeUrl - Cloudinary URL of the before image
 * @param {string} afterUrl - Cloudinary URL of the after image
 * @returns {Promise<object>} Parsed comparison JSON
 */
export const compareBeforeAfter = async (beforeUrl, afterUrl) => {
  if (!beforeUrl || !afterUrl) {
    throw new Error('Both before and after image URLs are required for comparison');
  }

  const beforeImagePart = await fetchImageAsBase64(beforeUrl);
  const afterImagePart = await fetchImageAsBase64(afterUrl);

  const prompt = `You are comparing a "before" and "after" image of a government infrastructure
project claimed as completed. Return ONLY valid JSON:
{
  "completionScore": number (0-100),
  "riskLevel": "Low" | "Medium" | "High",
  "projectHealth": "Healthy" | "At Risk" | "Failed",
  "notes": string
}
Judge based only on visible evidence in both images. If the after image does not
clearly show the claimed work, reflect that with a lower completionScore, not by
guessing what might be true.`;

  return callGeminiJson(prompt, [beforeImagePart, afterImagePart]);
};
