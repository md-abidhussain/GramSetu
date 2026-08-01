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
 * Detect damage/discrepancies by comparing citizen report image against original completion image
 * @param {string} citizenUrl - Cloudinary URL of the citizen report photo
 * @param {string} completionUrl - Cloudinary URL of the project completion photo
 * @returns {Promise<object>} Parsed damage detection JSON
 */
export const detectDamageAndDiscrepancies = async (citizenUrl, completionUrl) => {
  if (!citizenUrl || !completionUrl) {
    throw new Error('Both citizen photo and official completion photo URLs are required');
  }

  const citizenImagePart = await fetchImageAsBase64(citizenUrl);
  const completionImagePart = await fetchImageAsBase64(completionUrl);

  const prompt = `Compare the citizen-submitted image against the original completion image for
the same location. Return ONLY valid JSON:
{
  "detectedIssues": string[],   from this list only: ["crack","road_damage","leakage","broken_infrastructure","garbage","none"],
  "matchScore": number (0-100),  how consistent current state is with claimed completion,
  "flaggedAsDiscrepancy": boolean,
  "aiReport": string   plain language explanation for a citizen or official reading this
}`;

  return callGeminiJson(prompt, [citizenImagePart, completionImagePart]);
};
