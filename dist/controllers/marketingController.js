"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSocialPost = exports.generateHashtags = exports.generateDescription = exports.getMiBranding = exports.generarPlanContenidos = exports.generarMercadoObjetivo = exports.generarBrandingSensorial = exports.procesarTest = exports.getPreguntas = void 0;
const ArtistModel = __importStar(require("../models/Artist"));
const BrandingModel = __importStar(require("../models/Branding"));
const TrackModel = __importStar(require("../models/Track"));
const generative_ai_1 = require("@google/generative-ai");
const geminiService = __importStar(require("../services/geminiService")); // <-- NUEVO SERVICIO
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const preguntasArquetipo = [
    "1. ¿Cuál es tu motivación principal para crear música?",
    "2. ¿Cómo describirías tu relación con tu audiencia?",
    "3. ¿Qué tipo de historias te sientes más inclinado a contar?",
    "4. ¿Qué emoción quieres que la gente sienta al escucharte?",
    "5. ¿Cómo manejas los momentos de crisis o bloqueo creativo?",
    "6. ¿Qué papel juega la estética visual en tu proyecto?",
    "7. ¿Prefieres encajar en la industria o romper sus reglas?",
    "8. ¿Qué legado quieres dejar con tu música?",
    "9. ¿Cómo te ves a ti mismo: un guía, un rebelde, un sanador, un creador, un amante, un sabio, un mago, un héroe, un inocente, un explorador, un bufón, o un cuidador? (elige uno o combina dos)",
    "10. ¿Qué colores te representan más?",
    "11. ¿Qué olor asocias con tu música?",
    "12. ¿Qué textura describiría mejor tu sonido?"
];
const getPreguntas = (req, res) => {
    res.json(preguntasArquetipo);
};
exports.getPreguntas = getPreguntas;
const procesarTest = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Crea un artista primero' });
        const artist = artists[0];
        const { respuestas } = req.body;
        if (!respuestas || !Array.isArray(respuestas) || respuestas.length !== 12) {
            return res.status(400).json({ error: 'Se requieren 12 respuestas' });
        }
        BrandingModel.createOrUpdateBranding(artist.id, {
            respuestas_test: JSON.stringify(respuestas)
        });
        const prompt = `
      Eres un experto en arquetipos de marca para artistas musicales.
      Basado en las siguientes 12 respuestas, determina el arquetipo principal del artista (puede ser uno o combinación de dos) entre: Héroe, Rebelde, Amante, Creador, Sabio, Mago, Inocente, Explorador, Gobernante, Cuidador, Bufón.
      Además, genera un manifiesto de marca de máximo 5 líneas que resuma su esencia.

      Respuestas:
      ${respuestas.map((r, i) => `${i + 1}. ${r}`).join('\n')}

      Devuelve EXCLUSIVAMENTE un objeto JSON con esta estructura:
      {
        "arquetipo": "nombre del arquetipo",
        "manifiesto": "texto del manifiesto"
      }
    `;
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const aiResponse = JSON.parse(jsonStr);
        BrandingModel.createOrUpdateBranding(artist.id, {
            arquetipo: aiResponse.arquetipo,
            manifiesto: aiResponse.manifiesto
        });
        res.json({
            message: 'Test procesado',
            arquetipo: aiResponse.arquetipo,
            manifiesto: aiResponse.manifiesto
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar el test' });
    }
};
exports.procesarTest = procesarTest;
const generarBrandingSensorial = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'No hay artista' });
        const artist = artists[0];
        const branding = BrandingModel.getBrandingByArtist(artist.id);
        if (!branding || !branding.arquetipo) {
            return res.status(400).json({ error: 'Primero completa el test de arquetipo' });
        }
        const prompt = `
      Eres un experto en branding sensorial para artistas.
      El artista tiene el arquetipo: ${branding.arquetipo}.
      Basado en las respuestas del test: ${branding.respuestas_test}

      Genera una propuesta de branding con:
      - Colores: dos colores específicos (nombres y códigos HEX) que representen su esencia.
      - Olores: ¿a qué huele su estudio cuando crea?
      - Sabores: si su música fuera una bebida, ¿qué sería?
      - Texturas: ¿su marca se siente como? (ej: acero pulido, terciopelo, hormigón)
      - Lenguaje de la tribu: palabras o gestos que solo entiendan sus fans.
      - Símbolo: qué símbolo lo representaría internacionalmente (ej: una letra, un ícono).

      Devuelve EXCLUSIVAMENTE un objeto JSON con esta estructura:
      {
        "colores": "descripción con códigos HEX",
        "olores": "descripción",
        "sabores": "descripción",
        "texturas": "descripción",
        "lenguaje_tribu": "descripción",
        "simbolo": "descripción"
      }
    `;
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const aiResponse = JSON.parse(jsonStr);
        BrandingModel.createOrUpdateBranding(artist.id, {
            colores: aiResponse.colores,
            olores: aiResponse.olores,
            sabores: aiResponse.sabores,
            texturas: aiResponse.texturas,
            lenguaje_tribu: aiResponse.lenguaje_tribu,
            simbolo: aiResponse.simbolo
        });
        res.json(aiResponse);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar branding' });
    }
};
exports.generarBrandingSensorial = generarBrandingSensorial;
const generarMercadoObjetivo = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'No hay artista' });
        const artist = artists[0];
        const branding = BrandingModel.getBrandingByArtist(artist.id);
        if (!branding || !branding.arquetipo) {
            return res.status(400).json({ error: 'Primero completa el branding' });
        }
        const prompt = `
      Eres un estratega de marketing musical.
      El artista tiene:
      - Arquetipo: ${branding.arquetipo}
      - Branding sensorial: ${JSON.stringify({
            colores: branding.colores,
            olores: branding.olores,
            sabores: branding.sabores,
            texturas: branding.texturas,
            lenguaje_tribu: branding.lenguaje_tribu,
            simbolo: branding.simbolo
        })}

      Genera:
      1. Mercados prioritarios internacionales (3 países/ciudades) y por qué.
      2. Perfil psicográfico del oyente ideal (edad, mentalidad, intereses, comportamiento).

      Devuelve EXCLUSIVAMENTE un objeto JSON con:
      {
        "mercados": ["País/Ciudad 1 - razón", "País/Ciudad 2 - razón", "País/Ciudad 3 - razón"],
        "perfil_oyente": "descripción detallada"
      }
    `;
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const aiResponse = JSON.parse(jsonStr);
        BrandingModel.createOrUpdateBranding(artist.id, {
            mercados_prioritarios: JSON.stringify(aiResponse.mercados),
            perfil_oyente: aiResponse.perfil_oyente
        });
        res.json(aiResponse);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar mercado' });
    }
};
exports.generarMercadoObjetivo = generarMercadoObjetivo;
const generarPlanContenidos = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'No hay artista' });
        const artist = artists[0];
        const branding = BrandingModel.getBrandingByArtist(artist.id);
        if (!branding || !branding.arquetipo) {
            return res.status(400).json({ error: 'Completa el branding primero' });
        }
        const prompt = `
      Eres un estratega de contenidos para artistas musicales.
      Debes crear un plan de 30 días para redes sociales (Reels) con guiones segundo a segundo.

      INFORMACIÓN DEL ARTISTA:
      - Nombre: ${artist.name}
      - Arquetipo: ${branding.arquetipo}
      - Manifiesto: ${branding.manifiesto}
      - Branding sensorial: ${JSON.stringify({
            colores: branding.colores,
            olores: branding.olores,
            sabores: branding.sabores,
            texturas: branding.texturas,
            lenguaje_tribu: branding.lenguaje_tribu,
            simbolo: branding.simbolo
        })}
      - Mercados objetivo: ${branding.mercados_prioritarios}
      - Perfil de oyente: ${branding.perfil_oyente}

      ESTRUCTURA DEL PLAN (4 fases):
      Fase 1 (Días 1-7): Demolición y misterio - Evaluación (atraer)
      Fase 2 (Días 8-15): Conexión y storytelling - Presentación/Validación (conectar)
      Fase 3 (Días 16-23): Validación del mercado - Validación (que la audiencia elija)
      Fase 4 (Días 24-30): Conversión y ascensión - Tráfico y comunidad

      Para CADA DÍA, genera un guion de Reel con:
      - Duración aproximada
      - Objetivo del día
      - Desglose segundo a segundo (00-03s, 03-07s, etc.) con:
        * Visual (descripción de la imagen)
        * Audio (música, voz, efectos)
        * Texto en pantalla
      - Técnica de neurociencia aplicada (ej: dopamina, FOMO, pertenencia)
      - CTA (llamado a la acción)

      Devuelve EXCLUSIVAMENTE un objeto JSON con:
      {
        "plan": [
          {
            "dia": 1,
            "titulo": "título del reel",
            "duracion": "15s",
            "objetivo": "descripción",
            "guion": [
              {"tiempo": "00-03s", "visual": "...", "audio": "...", "texto": "..."},
              ...
            ],
            "neurociencia": "técnica",
            "cta": "texto del llamado"
          },
          ... (para los 30 días)
        ]
      }
    `;
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const aiResponse = JSON.parse(jsonStr);
        BrandingModel.createOrUpdateBranding(artist.id, {
            plan_contenidos: JSON.stringify(aiResponse.plan),
            fecha_generacion_plan: new Date().toISOString()
        });
        res.json(aiResponse);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar plan de contenidos' });
    }
};
exports.generarPlanContenidos = generarPlanContenidos;
const getMiBranding = (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'No hay artista' });
        const artist = artists[0];
        const branding = BrandingModel.getBrandingByArtist(artist.id);
        if (branding) {
            if (branding.respuestas_test) {
                branding.respuestas_test = JSON.parse(branding.respuestas_test);
            }
            if (branding.mercados_prioritarios) {
                branding.mercados_prioritarios = JSON.parse(branding.mercados_prioritarios);
            }
            if (branding.plan_contenidos) {
                branding.plan_contenidos = JSON.parse(branding.plan_contenidos);
            }
        }
        res.json(branding || {});
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener branding' });
    }
};
exports.getMiBranding = getMiBranding;
// ============================================
// NUEVAS FUNCIONES DE PROMOCIÓN CON IA
// ============================================
/**
 * Genera una descripción promocional para un track.
 */
const generateDescription = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId, customTitle, customArtist, genre, mood } = req.body;
        let title;
        let artist;
        if (trackId) {
            // Usar datos del track existente
            const track = await TrackModel.getTrackById(trackId);
            if (!track)
                return res.status(404).json({ error: 'Track no encontrado' });
            title = track.title;
            // Obtener nombre del artista
            const artistObj = await ArtistModel.getArtistById(track.artist_id);
            artist = artistObj?.name || 'Artista';
        }
        else {
            // Usar datos proporcionados manualmente
            if (!customTitle || !customArtist) {
                return res.status(400).json({ error: 'Se requiere trackId o customTitle y customArtist' });
            }
            title = customTitle;
            artist = customArtist;
        }
        const description = await geminiService.generateSongDescription(title, artist, genre, mood);
        res.json({ description });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar descripción' });
    }
};
exports.generateDescription = generateDescription;
/**
 * Genera hashtags para un track.
 */
const generateHashtags = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId, customTitle, customArtist, genre, mood } = req.body;
        let title;
        let artist;
        if (trackId) {
            const track = await TrackModel.getTrackById(trackId);
            if (!track)
                return res.status(404).json({ error: 'Track no encontrado' });
            title = track.title;
            const artistObj = await ArtistModel.getArtistById(track.artist_id);
            artist = artistObj?.name || 'Artista';
        }
        else {
            if (!customTitle || !customArtist) {
                return res.status(400).json({ error: 'Se requiere trackId o customTitle y customArtist' });
            }
            title = customTitle;
            artist = customArtist;
        }
        const hashtags = await geminiService.generateHashtags(title, artist, genre, mood);
        res.json({ hashtags });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar hashtags' });
    }
};
exports.generateHashtags = generateHashtags;
/**
 * Genera un post completo para redes sociales.
 */
const generateSocialPost = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId, customTitle, customArtist, genre, mood } = req.body;
        let title;
        let artist;
        if (trackId) {
            const track = await TrackModel.getTrackById(trackId);
            if (!track)
                return res.status(404).json({ error: 'Track no encontrado' });
            title = track.title;
            const artistObj = await ArtistModel.getArtistById(track.artist_id);
            artist = artistObj?.name || 'Artista';
        }
        else {
            if (!customTitle || !customArtist) {
                return res.status(400).json({ error: 'Se requiere trackId o customTitle y customArtist' });
            }
            title = customTitle;
            artist = customArtist;
        }
        const post = await geminiService.generateSocialPost(title, artist, genre, mood);
        res.json(post);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al generar post' });
    }
};
exports.generateSocialPost = generateSocialPost;
