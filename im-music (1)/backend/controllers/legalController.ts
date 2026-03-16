import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const consultarLegal = async (req: AuthRequest, res: Response) => {
  try {
    const { pregunta } = req.body;
    if (!pregunta) return res.status(400).json({ error: 'Pregunta requerida' });

    const prompt = `
      Eres un experto legal en la industria musical (Music Attorney). 
      Responde a la siguiente consulta de un artista de forma profesional, clara y educativa.
      Consulta: "${pregunta}"
      
      Temas a cubrir si es relevante:
      - Derechos de autor (Copyright)
      - Contratos de distribución y sellos
      - Publishing y sociedades de gestión (BMI, ASCAP, SGAE, etc.)
      - Splits y regalías mecánicas/de ejecución.
      
      Descargo de responsabilidad: Aclara que esto es información educativa y no asesoría legal formal.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.json({ respuesta: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar consulta legal' });
  }
};
