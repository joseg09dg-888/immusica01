import dotenv from 'dotenv';
dotenv.config();

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const PORT = parseInt(process.env.PORT || '3000', 10);

export const isGeminiConfigured = (): boolean => {
  return Boolean(GEMINI_API_KEY && GEMINI_API_KEY.length > 0);
};
