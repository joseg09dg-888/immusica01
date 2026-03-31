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
exports.listMyYouTubeRegistrations = exports.getYouTubeStatus = exports.registerInYouTube = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
const TrackModel = __importStar(require("../models/Track"));
const crypto_1 = __importDefault(require("crypto"));
// ============================================
// REGISTRAR UN TRACK EN YOUTUBE CONTENT ID (SIMULADO)
// ============================================
const registerInYouTube = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.body;
        if (!trackId) {
            return res.status(400).json({ error: 'trackId es obligatorio' });
        }
        // Verificar que el track pertenezca al artista
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const track = TrackModel.getTrackById(trackId);
        if (!track || track.artist_id !== artistId) {
            return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
        }
        // Verificar si ya está registrado
        const existing = database_1.default.prepare('SELECT id FROM youtube_content_id WHERE track_id = ?').get(trackId);
        if (existing) {
            return res.status(400).json({ error: 'Este track ya ha sido registrado en YouTube Content ID' });
        }
        // Generar un ID de registro simulado
        const registrationId = crypto_1.default.randomBytes(16).toString('hex');
        // Simular registro (en un caso real, aquí se llamaría a la API de YouTube)
        const now = new Date().toISOString();
        database_1.default.prepare(`
      INSERT INTO youtube_content_id (track_id, registration_id, status, registered_at)
      VALUES (?, ?, 'registered', ?)
    `).run(trackId, registrationId, now);
        res.status(201).json({
            message: 'Track registrado en YouTube Content ID (simulado)',
            registrationId,
            trackId
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar en YouTube' });
    }
};
exports.registerInYouTube = registerInYouTube;
// ============================================
// OBTENER ESTADO DE REGISTRO DE UN TRACK
// ============================================
const getYouTubeStatus = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.params;
        // Manejar si trackId es un array (por seguridad)
        const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
        const trackIdNum = parseInt(trackIdStr, 10);
        if (isNaN(trackIdNum)) {
            return res.status(400).json({ error: 'ID de track inválido' });
        }
        // Verificar propiedad
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const track = TrackModel.getTrackById(trackIdNum);
        if (!track || track.artist_id !== artistId) {
            return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
        }
        const status = database_1.default.prepare(`
      SELECT * FROM youtube_content_id WHERE track_id = ?
    `).get(trackIdNum);
        if (!status) {
            return res.status(404).json({ error: 'Este track no ha sido registrado en YouTube Content ID' });
        }
        res.json(status);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estado' });
    }
};
exports.getYouTubeStatus = getYouTubeStatus;
// ============================================
// LISTAR TODOS LOS REGISTROS DEL ARTISTA
// ============================================
const listMyYouTubeRegistrations = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.json([]);
        const artistId = artists[0].id;
        // Obtener todos los tracks del artista
        const tracks = database_1.default.prepare('SELECT id FROM tracks WHERE artist_id = ?').all(artistId);
        if (tracks.length === 0)
            return res.json([]);
        const placeholders = tracks.map(() => '?').join(',');
        const trackIds = tracks.map(t => t.id);
        const registrations = database_1.default.prepare(`
      SELECT y.*, t.title as track_title
      FROM youtube_content_id y
      JOIN tracks t ON y.track_id = t.id
      WHERE y.track_id IN (${placeholders})
      ORDER BY y.created_at DESC
    `).all(...trackIds);
        res.json(registrations);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar registros' });
    }
};
exports.listMyYouTubeRegistrations = listMyYouTubeRegistrations;
