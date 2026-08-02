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

/**
 * Detect damage in a single citizen report image when no original project image is available
 * @param {string} citizenUrl - Cloudinary URL of the citizen report photo
 * @returns {Promise<object>} Parsed damage detection JSON
 */
export const detectDamageSingleImage = async (citizenUrl) => {
  if (!citizenUrl) {
    throw new Error('Citizen photo URL is required');
  }

  const citizenImagePart = await fetchImageAsBase64(citizenUrl);

  const prompt = `Analyze the citizen-submitted image for infrastructure damage (like cracks, potholes, road damage, leakage, broken infrastructure, or garbage). Return ONLY valid JSON:
{
  "detectedIssues": string[],   from this list only: ["crack","road_damage","leakage","broken_infrastructure","garbage","none"],
  "matchScore": number (0-100),  set to 100 if no issues/damages are found, or lower depending on the severity of damage (e.g., 50-70 for moderate damage, 0-30 for severe road destruction/failure),
  "flaggedAsDiscrepancy": boolean,  set to true if any significant damage/issue is found,
  "aiReport": string   plain language explanation describing the state of the infrastructure and details of any detected damages
}`;

  return callGeminiJson(prompt, [citizenImagePart]);
};
