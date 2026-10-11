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
    // The URL is logged for debugging but kept out of the thrown message, which
    // reaches the browser. Seeded demo photos point at an external photo site
    // that sometimes removes them, and a missing photo should read as a missing
    // photo rather than a stack of internal detail.
    console.error(`Could not download image from ${url}:`, error.message);
    throw new Error('A photo for this project could not be loaded, so the AI comparison could not run.');
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
