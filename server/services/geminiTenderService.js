import { callGeminiJson } from './geminiClient.js';

/**
 * Analyzes tender text using Gemini and returns structured metadata
 * @param {string} extractedText - Text from the tender PDF
 * @returns {Promise<object>} Parsed tender analysis JSON
 */
export const analyzeTender = async (extractedText) => {
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text extracted from the tender PDF to analyze');
  }

  // Slice text if it exceeds Gemini's context limits, but 1.5 flash has huge limits so standard slice of 100k chars is fine
  const textSample = extractedText.slice(0, 150000);

  const prompt = `You are analyzing a government tender document. Given the extracted text below,
return ONLY valid JSON with this exact shape:
{
  "summary": string,
  "budgetAllocated": string,
  "budgetAnalysis": { "flagged": boolean, "reason": string },
  "timelineAnalysis": { "flagged": boolean, "reason": string },
  "riskScore": number (0-100),
  "riskLevel": "Low" | "Medium" | "High",
  "recommendation": string
}
Flag budget concerns only if the document itself shows inconsistency, unusually
vague terms, or unexplained cost jumps. Do not invent figures not present in the text.

Document text:
${textSample}`;

  return callGeminiJson(prompt);
};
