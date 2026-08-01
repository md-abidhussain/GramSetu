import genAI from '../config/geminiConfig.js';

/**
 * Clean up a response string that may contain markdown JSON code blocks
 */
export const cleanJsonString = (str) => {
  let cleaned = str.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }
  return cleaned;
};

/**
 * Common function to invoke Gemini model and return structured JSON
 * @param {string} prompt - Prompt instruction
 * @param {Array<{mimeType: string, data: string}>} files - Optional inline base64 files
 * @param {string} modelName - Model name, defaults to 'gemini-3.1-flash-lite'
 * @returns {Promise<object>} Parsed JSON response
 */
export const callGeminiJson = async (prompt, files = [], modelName = 'gemini-3.1-flash-lite') => {
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

    const contents = [...files, prompt];

    // Set a timeout limit (e.g., 25 seconds)
    const generatePromise = model.generateContent(contents);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), 25000)
    );

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    try {
      const cleaned = cleanJsonString(responseText);
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON. Raw text:', responseText);
      throw new Error(`Gemini returned invalid JSON structure: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API Error: ${error.message}`);
  }
};
