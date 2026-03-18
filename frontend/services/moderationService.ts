import { GoogleGenerativeAI } from '@google/generative-ai';

// Configurar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Palabras o frases prohibidas (lista de respaldo)
const bannedWords = [
  'racista', 'xenófobo', 'puta', 'maricón', 'negro de mierda',
  'maltrato', 'violencia', 'mata', 'suicidio', 'nazi', 'fascista'
  // Agrega las que consideres
];

// Función principal de moderación
export async function moderateMessage(message: string): Promise<{
  flagged: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}> {
  // Primero, filtro rápido por palabras prohibidas
  const lowerMessage = message.toLowerCase();
  for (const word of bannedWords) {
    if (lowerMessage.includes(word)) {
      return { flagged: true, reason: `Contiene palabra prohibida: ${word}`, severity: 'high' };
    }
  }

  // Llamar a Gemini para análisis contextual
  try {
    const prompt = `
Eres un moderador de chat comunitario para una plataforma musical. Debes analizar el siguiente mensaje y determinar si infringe las reglas:
- Sin racismo, xenofobia, lenguaje soez, maltrato, acoso, insultos graves.
- El objetivo es mantener un ambiente respetuoso para contactos profesionales (beats, playlists, colaboraciones, contratos).
- Si el mensaje es inapropiado, indica flagged=true y una razón breve y la severidad (low, medium, high).
- Si es aceptable, flagged=false.

Mensaje: "${message}"

Responde SOLO con un JSON válido: { "flagged": boolean, "reason": string, "severity": "low" | "medium" | "high" }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const cleanResponse = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanResponse);
    return parsed;
  } catch (error) {
    console.error('Error en moderación con IA:', error);
    // Si falla la IA, consideramos no flaggear (falso negativo controlado)
    return { flagged: false, reason: 'Error en moderación automática' };
  }
}