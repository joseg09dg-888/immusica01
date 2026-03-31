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
exports.getSubmissionById = exports.getMySubmissions = exports.submitToPlaylist = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
const TrackModel = __importStar(require("../models/Track"));
// ============================================
// ENVIAR TRACK A UNA PLAYLIST
// ============================================
const submitToPlaylist = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { playlistId, trackId, message } = req.body;
        if (!playlistId || !trackId) {
            return res.status(400).json({ error: 'playlistId y trackId son obligatorios' });
        }
        // Obtener artist_id del usuario
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id; // Asumimos que el usuario tiene al menos un artista (el principal)
        // Verificar que el track pertenece al artista
        const track = TrackModel.getTrackById(trackId);
        if (!track || track.artist_id !== artistId) {
            return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
        }
        // Verificar que la playlist existe y obtener su email de contacto
        const playlist = database_1.default.prepare('SELECT id, contact_email FROM playlists WHERE id = ?').get(playlistId);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist no encontrada' });
        }
        if (!playlist.contact_email) {
            return res.status(400).json({ error: 'Esta playlist no tiene email de contacto' });
        }
        // Registrar el envío
        const insert = database_1.default.prepare(`
      INSERT INTO playlist_submissions (playlist_id, track_id, artist_id, message, contact_email, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
        const result = insert.run(playlistId, trackId, artistId, message || null, playlist.contact_email);
        // Aquí podrías integrar un servicio de email real para notificar al curador
        // Por ahora, simulamos el envío con un console.log
        console.log(`📧 Simulando envío de email a ${playlist.contact_email}`);
        // Usamos el nombre del artista desde la variable artists (el primer artista)
        const artistName = artists[0]?.name || 'Desconocido';
        console.log(`Artista: ${artistName}, Track: ${track.title}`);
        console.log(`Mensaje: ${message || 'Sin mensaje'}`);
        res.status(201).json({
            id: result.lastInsertRowid,
            message: 'Track enviado a la playlist correctamente'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al enviar a playlist' });
    }
};
exports.submitToPlaylist = submitToPlaylist;
// ============================================
// LISTAR ENVÍOS REALIZADOS POR EL ARTISTA
// ============================================
const getMySubmissions = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.json([]);
        const artistId = artists[0].id;
        const submissions = database_1.default.prepare(`
      SELECT s.*, p.name as playlist_name, t.title as track_title
      FROM playlist_submissions s
      JOIN playlists p ON s.playlist_id = p.id
      JOIN tracks t ON s.track_id = t.id
      WHERE s.artist_id = ?
      ORDER BY s.submitted_at DESC
    `).all(artistId);
        res.json(submissions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener envíos' });
    }
};
exports.getMySubmissions = getMySubmissions;
// ============================================
// OBTENER DETALLE DE UN ENVÍO
// ============================================
const getSubmissionById = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const submission = database_1.default.prepare(`
      SELECT s.*, p.name as playlist_name, t.title as track_title
      FROM playlist_submissions s
      JOIN playlists p ON s.playlist_id = p.id
      JOIN tracks t ON s.track_id = t.id
      WHERE s.id = ? AND s.artist_id = ?
    `).get(id, artistId);
        if (!submission) {
            return res.status(404).json({ error: 'Envío no encontrado' });
        }
        res.json(submission);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener envío' });
    }
};
exports.getSubmissionById = getSubmissionById;
