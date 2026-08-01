import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.warn('Warning: GEMINI_API_KEY environment variable is not defined.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey || 'dummy_key');

export default genAI;
