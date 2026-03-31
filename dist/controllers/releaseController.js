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
exports.getScheduledTracks = exports.getReleaseInfo = exports.cancelScheduled = exports.scheduleRelease = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
// Programar fecha de lanzamiento de un track
const scheduleRelease = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.params;
        const { scheduled_date } = req.body;
        if (!scheduled_date) {
            return res.status(400).json({ error: 'La fecha programada es obligatoria' });
        }
        // Validar que la fecha sea futura
        const scheduled = new Date(scheduled_date);
        const now = new Date();
        if (scheduled <= now) {
            return res.status(400).json({ error: 'La fecha debe ser posterior al momento actual' });
        }
        // Obtener artist_id del usuario
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        // Verificar que el track pertenezca al artista
        const track = database_1.default.prepare('SELECT id, status FROM tracks WHERE id = ? AND artist_id = ?').get(trackId, artistId);
        if (!track) {
            return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
        }
        // Actualizar el track
        database_1.default.prepare(`
      UPDATE tracks 
      SET scheduled_date = ?, status = 'scheduled'
      WHERE id = ?
    `).run(scheduled_date, trackId);
        res.json({ message: 'Lanzamiento programado correctamente', scheduled_date });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al programar lanzamiento' });
    }
};
exports.scheduleRelease = scheduleRelease;
// Cancelar programación
const cancelScheduled = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.params;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const track = database_1.default.prepare('SELECT id, status FROM tracks WHERE id = ? AND artist_id = ?').get(trackId, artistId);
        if (!track) {
            return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
        }
        database_1.default.prepare(`
      UPDATE tracks 
      SET scheduled_date = NULL, status = 'draft'
      WHERE id = ?
    `).run(trackId);
        res.json({ message: 'Programación cancelada' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cancelar programación' });
    }
};
exports.cancelScheduled = cancelScheduled;
// Obtener información de programación de un track
const getReleaseInfo = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.params;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const track = database_1.default.prepare(`
      SELECT id, title, scheduled_date, release_date, published_at, status
      FROM tracks 
      WHERE id = ? AND artist_id = ?
    `).get(trackId, artistId);
        if (!track) {
            return res.status(404).json({ error: 'Track no encontrado' });
        }
        res.json(track);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener información' });
    }
};
exports.getReleaseInfo = getReleaseInfo;
// Listar tracks programados del artista
const getScheduledTracks = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.json([]);
        const artistId = artists[0].id;
        const tracks = database_1.default.prepare(`
      SELECT id, title, scheduled_date, status
      FROM tracks
      WHERE artist_id = ? AND status = 'scheduled'
      ORDER BY scheduled_date ASC
    `).all(artistId);
        res.json(tracks);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener tracks programados' });
    }
};
exports.getScheduledTracks = getScheduledTracks;
