import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `Eres el asistente de IA de IM Music, una plataforma para artistas musicales independientes.
Eres experto en: distribución musical, royalties, marketing digital, estrategia de carrera, derechos musicales,
redes sociales, Spotify, Apple Music, YouTube, TikTok, licensing, publishing y todo lo relacionado con la industria musical.
Responde siempre en español, de forma concisa y profesional. Si el usuario pregunta algo fuera de la música,
redirígelo amablemente al tema musical.`;

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 30,
  indie: 100,
  pro: 999999
};

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Mensaje requerido' });

    // Check plan & token limits
    const sub = await db.prepare(
      `SELECT plan_id FROM subscriptions WHERE user_email = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`
    ).get(req.user.email) as { plan_id: string } | undefined;
    const plan = sub?.plan_id || 'free';
    const limit = PLAN_LIMITS[plan] ?? 10;

    const userRow = await db.prepare(
      `SELECT ai_tokens_used, ai_tokens_reset FROM users WHERE id = ?`
    ).get(req.user.id) as { ai_tokens_used: number | null; ai_tokens_reset: string | null } | undefined;

    const now = new Date();
    const resetDate = userRow?.ai_tokens_reset ? new Date(userRow.ai_tokens_reset) : null;
    const needsReset = !resetDate || now > resetDate;
    const usedTokens = needsReset ? 0 : (userRow?.ai_tokens_used ?? 0);

    if (limit < 999999 && usedTokens >= limit) {
      return res.status(429).json({
        error: `Límite de ${limit} mensajes IA alcanzado para el plan ${plan}. Actualiza tu plan para continuar.`,
        limit,
        used: usedTokens,
        plan,
        upgradeUrl: '/settings'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Servicio de IA no configurado — falta GEMINI_API_KEY' });

    const contents = [
      ...(history as { role: string; content: string }[]).map(h => ({
        role: h.role === 'ai' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nPregunta: ${message}` }] }
    ];

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );

    const data = await resp.json() as any;
    if (data.error) throw new Error(data.error.message || 'Error de Gemini API');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';

    // Update token count (reset monthly)
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    if (needsReset) {
      await db.prepare(
        `UPDATE users SET ai_tokens_used = 1, ai_tokens_reset = ? WHERE id = ?`
      ).run(nextReset, req.user.id);
    } else {
      await db.prepare(
        `UPDATE users SET ai_tokens_used = COALESCE(ai_tokens_used, 0) + 1 WHERE id = ?`
      ).run(req.user.id);
    }

    res.json({
      response: text,
      timestamp: new Date().toISOString(),
      tokensUsed: usedTokens + 1,
      tokensLimit: limit
    });
  } catch (error: any) {
    console.error('Error en AI chat:', error);
    res.status(500).json({ error: 'Error al procesar mensaje con IA' });
  }
};

export const getModels = (_req: AuthRequest, res: Response) => {
  res.json({ model: 'gemini-2.0-flash', status: 'active' });
};

export const marketIntel = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { genre, artistType } = req.body;
    if (!genre || !artistType) return res.status(400).json({ error: 'Género y tipo de artista requeridos' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Servicio de IA no configurado' });

    const prompt = `Eres un experto en la industria musical latinoamericana con acceso a datos de Spotify, Apple Music y YouTube Music.

Para un artista de género "${genre}" tipo "${artistType}", proporciona análisis de mercado en formato JSON exacto:

{
  "topCountries": [
    {"country": "Colombia", "flag": "🇨🇴", "percentage": 35},
    {"country": "México", "flag": "🇲🇽", "percentage": 28},
    {"country": "Argentina", "flag": "🇦🇷", "percentage": 15},
    {"country": "Chile", "flag": "🇨🇱", "percentage": 12},
    {"country": "Perú", "flag": "🇵🇪", "percentage": 10}
  ],
  "topCities": [
    {"city": "Bogotá", "country": "Colombia", "streams": "2.4M"},
    {"city": "Medellín", "country": "Colombia", "streams": "1.8M"},
    {"city": "Ciudad de México", "country": "México", "streams": "1.5M"},
    {"city": "Buenos Aires", "country": "Argentina", "streams": "1.2M"},
    {"city": "Santiago", "country": "Chile", "streams": "980K"}
  ],
  "audience": {
    "ageRange": "18-28",
    "gender": "58% Masculino",
    "platform": "Spotify",
    "peakTime": "8pm-11pm"
  },
  "strategy": "Estrategia detallada de 3-4 oraciones sobre cómo y dónde lanzar la música para este género y tipo de artista."
}

Adapta todos los datos al género "${genre}" y tipo de artista "${artistType}". Responde SOLO con el JSON válido, sin texto adicional.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
        })
      }
    );
    const data = await resp.json() as any;
    if (data.error) throw new Error(data.error.message || 'Error de Gemini');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error en market intel:', error);
    res.status(500).json({ error: 'Error al analizar mercado' });
  }
};
