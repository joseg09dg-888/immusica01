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
exports.getHistorial = exports.analizarContrato = exports.consultarLegal = void 0;
const ArtistModel = __importStar(require("../models/Artist"));
const LegalQueryModel = __importStar(require("../models/LegalQuery"));
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const LEGAL_SYSTEM_PROMPT = `
Eres un asesor legal experto en propiedad intelectual y derecho del entretenimiento, con especialización internacional.
Tu rol es ayudar a artistas musicales y productores a entender sus derechos, contratos y opciones legales.
Debes ser empático, claro y detallado en tus respuestas.

**Áreas de especialización:**
- Splits, lanzamientos, master, publishing, gestión colectiva
- Contratos de licencia, cesión, sincronización
- Derechos conexos, regalías, royalties
- Detección de abusos, cláusulas abusivas
- Legislación internacional

**IMPORTANTE:** Al final de cada respuesta, incluye una advertencia de que esto es solo orientativo y que deben consultar con un abogado real.
`;
// CHAT CONSULTIVO (LO ÚNICO QUE FUNCIONA AHORA)
const consultarLegal = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Crea un artista primero' });
        const artist = artists[0];
        const { pregunta } = req.body;
        if (!pregunta)
            return res.status(400).json({ error: 'La pregunta es obligatoria' });
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent({
            contents: [
                { role: 'user', parts: [{ text: LEGAL_SYSTEM_PROMPT }] },
                { role: 'user', parts: [{ text: `El artista pregunta: ${pregunta}` }] }
            ]
        });
        let respuesta = result.response.text();
        if (!respuesta.includes('abogado')) {
            respuesta += '\n\n**Nota:** Esta información es solo orientativa. Consulta con un abogado especializado.';
        }
        await LegalQueryModel.createLegalQuery(artist.id, pregunta, respuesta);
        res.json({ respuesta });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la consulta legal' });
    }
};
exports.consultarLegal = consultarLegal;
// SUBIDA DE CONTRATOS (DESACTIVADA)
const analizarContrato = (req, res) => {
    res.status(501).json({ error: 'Funcionalidad en mantenimiento. Pronto podrás subir contratos.' });
};
exports.analizarContrato = analizarContrato;
// HISTORIAL
const getHistorial = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Crea un artista primero' });
        const artist = artists[0];
        const queries = LegalQueryModel.getQueriesByArtist(artist.id);
        res.json(queries);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
};
exports.getHistorial = getHistorial;
