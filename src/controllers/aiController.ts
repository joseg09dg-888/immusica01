import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

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
    let plan = 'free';
    try {
      const sub = await db.prepare(
        `SELECT plan_id FROM subscriptions WHERE user_email = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`
      ).get(req.user.email) as { plan_id: string } | undefined;
      plan = sub?.plan_id || 'free';
    } catch { /* plan_id column may not exist yet — default to free */ }
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

    let text = '';

    // Try Gemini first, fall back to Claude Haiku if depleted
    const geminiKey = process.env.GEMINI_API_KEY;
    let geminiOk = false;

    if (geminiKey) {
      const contents = [
        ...(history as { role: string; content: string }[]).map(h => ({
          role: h.role === 'ai' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nPregunta: ${message}` }] }
      ];
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 500 } }) }
      );
      const data = await resp.json() as any;
      if (!data.error && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = data.candidates[0].content.parts[0].text;
        geminiOk = true;
      }
    }

    // Claude Haiku fallback
    if (!geminiOk) {
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({ error: 'Servicio de IA temporalmente no disponible. Contacta al administrador.' });
      }
      const claudeResp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [
          ...(history as { role: string; content: string }[]).map(h => ({
            role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: h.content
          })),
          { role: 'user', content: message }
        ]
      });
      text = (claudeResp.content[0] as any).text || 'Sin respuesta';
    }

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

export const archetypeAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) return res.status(400).json({ error: 'Respuestas requeridas' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Servicio de IA no configurado' });

    const prompt = `Eres un experto en branding musical y arquetipos de marca. Analiza estas respuestas de un artista musical:

${answers.map((a: any, i: number) => `Pregunta ${i + 1}: ${a.question}\nRespuesta: ${a.answer}`).join('\n\n')}

Basado en estas respuestas, determina el arquetipo artístico y responde SOLO con JSON válido:
{
  "archetype": "Nombre del arquetipo (ej: El Rebelde, El Creador, El Héroe, El Explorador, El Sabio, El Amante)",
  "emoji": "Un emoji que represente el arquetipo",
  "description": "Descripción de 2-3 oraciones del arquetipo aplicado a este artista",
  "tribe": "Nombre de su comunidad/fanbase ideal (ej: Los Rebeldes, Los Soñadores)",
  "keyword": "Una palabra clave que define su marca",
  "brandColor": "Color hex que mejor representa su energía artística (ej: #5E17EB)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 600 } }) }
    );
    const data = await resp.json() as any;
    if (data.error) throw new Error(data.error.message || 'Error de Gemini');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (error: any) {
    console.error('Error en archetype analysis:', error);
    res.status(500).json({ error: 'Error al analizar arquetipo' });
  }
};

export const brandingGeneration = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { archetype, archetypeData } = req.body;
    if (!archetype) return res.status(400).json({ error: 'Arquetipo requerido' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Servicio de IA no configurado' });

    const prompt = `Eres un experto en branding musical. Un artista tiene el arquetipo "${archetype}".
Datos del arquetipo: ${JSON.stringify(archetypeData || {})}

Genera una estrategia de marca personal completa y responde SOLO con JSON válido:
{
  "concept": "Concepto de marca en 1 oración impactante",
  "tribe": "Descripción de su comunidad ideal y cómo conectar con ellos",
  "language": "Tono y estilo de comunicación (ej: 'Auténtico, cercano, con actitud')",
  "valueProposition": "Propuesta de valor única como artista en 2 oraciones",
  "tagline": "Tagline/slogan corto y memorable (máx 8 palabras)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6"],
  "colorPalette": ["#color1", "#color2", "#color3"],
  "contentPillars": ["Pilar 1", "Pilar 2", "Pilar 3"]
}`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 700 } }) }
    );
    const data = await resp.json() as any;
    if (data.error) throw new Error(data.error.message || 'Error de Gemini');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (error: any) {
    console.error('Error en branding generation:', error);
    res.status(500).json({ error: 'Error al generar branding' });
  }
};

export const metaAdsCopy = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { archetype, branding, market, genre, objective = 'streams', budget = '50000' } = req.body;
    if (!archetype) return res.status(400).json({ error: 'Arquetipo requerido' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Servicio de IA no configurado' });

    const prompt = `Eres un experto en Meta Ads para artistas musicales.
Artista con arquetipo "${archetype}", género "${genre || 'urbano'}", objetivo "${objective}", presupuesto $${budget} COP.
Branding: ${JSON.stringify(branding || {})}
Mercado: ${JSON.stringify(market || {})}

Crea 3 copies publicitarios optimizados para Meta Ads y responde SOLO con JSON válido:
{
  "ads": [
    {
      "format": "Historia (Stories)",
      "headline": "Título llamativo (máx 40 chars)",
      "copy": "Texto del anuncio (máx 125 chars)",
      "cta": "Call to action (ej: Escúchalo ahora)",
      "audience": "Descripción de audiencia objetivo",
      "tip": "Consejo de producción para este formato"
    },
    {
      "format": "Feed (Imagen/Video)",
      "headline": "Título llamativo (máx 40 chars)",
      "copy": "Texto del anuncio (máx 125 chars)",
      "cta": "Call to action",
      "audience": "Descripción de audiencia objetivo",
      "tip": "Consejo de producción para este formato"
    },
    {
      "format": "Reel (Video corto)",
      "headline": "Título llamativo (máx 40 chars)",
      "copy": "Texto del anuncio (máx 125 chars)",
      "cta": "Call to action",
      "audience": "Descripción de audiencia objetivo",
      "tip": "Consejo de producción para este formato"
    }
  ],
  "budgetRecommendation": "Recomendación de distribución del presupuesto entre los 3 formatos"
}`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 900 } }) }
    );
    const data = await resp.json() as any;
    if (data.error) throw new Error(data.error.message || 'Error de Gemini');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (error: any) {
    console.error('Error en meta ads copy:', error);
    res.status(500).json({ error: 'Error al generar copies de Meta Ads' });
  }
};

export const contentPlanGeneration = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { archetype, branding, market, genre } = req.body;
    if (!archetype) return res.status(400).json({ error: 'Arquetipo requerido' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Servicio de IA no configurado' });

    const prompt = `Eres un estratega de contenido para artistas musicales.
Artista: arquetipo "${archetype}", género "${genre || 'urbano'}".
Branding: ${JSON.stringify(branding || {})}
Mercado: ${JSON.stringify(market || {})}

Crea un plan de contenido mensual de 4 semanas y responde SOLO con JSON válido:
{
  "weeks": [
    {
      "week": 1,
      "theme": "Tema de la semana",
      "posts": [
        {
          "day": "Lunes",
          "format": "Reel / Post / Historia / TikTok",
          "title": "Título del contenido",
          "duration": "30s / 60s / Estática",
          "script": "Guión o descripción breve del contenido (2-3 oraciones)",
          "hashtags": ["#tag1", "#tag2", "#tag3"]
        }
      ]
    }
  ]
}
Incluye 3 posts por semana (4 semanas = 12 posts total). Variedad de formatos. Cada post debe ser accionable y específico.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 1200 } }) }
    );
    const data = await resp.json() as any;
    if (data.error) throw new Error(data.error.message || 'Error de Gemini');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (error: any) {
    console.error('Error en content plan generation:', error);
    res.status(500).json({ error: 'Error al generar plan de contenidos' });
  }
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
