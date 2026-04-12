import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `Eres el asistente de IA de IM Music, una plataforma para artistas musicales independientes.
Eres experto en: distribución musical, royalties, marketing digital, estrategia de carrera, derechos musicales,
redes sociales, Spotify, Apple Music, YouTube, TikTok, licensing, publishing y todo lo relacionado con la industria musical.
Responde siempre en español, de forma concisa y profesional. Si el usuario pregunta algo fuera de la música,
redirígelo amablemente al tema musical.`;

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Mensaje requerido' });

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    const formattedHistory = history.map((h: any) => ({
      role: h.role === 'ai' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    const chatSession = model.startChat({ history: formattedHistory });
    const result = await chatSession.sendMessage(message);
    const response = result.response.text();

    res.json({ response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error en AI chat:', error);
    res.status(500).json({ error: 'Error al procesar mensaje con IA' });
  }
};

export const getModels = (_req: AuthRequest, res: Response) => {
  res.json({ model: 'gemini-2.0-flash', status: 'active' });
};
