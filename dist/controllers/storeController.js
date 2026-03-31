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
exports.forceDistribute = exports.getDistributions = exports.deactivateAutoDistribute = exports.activateAutoDistribute = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
const TrackModel = __importStar(require("../models/Track"));
const stores_1 = require("../constants/stores");
// ============================================
// ACTIVAR DISTRIBUCIÓN AUTOMÁTICA PARA UN TRACK
// ============================================
const activateAutoDistribute = async (req, res) => {
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
        // Verificar propiedad del track
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const track = TrackModel.getTrackById(trackIdNum);
        if (!track || track.artist_id !== artistId) {
            return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
        }
        // Activar distribución automática (marcar en la tabla tracks)
        database_1.default.prepare('UPDATE tracks SET auto_distribute = 1 WHERE id = ?').run(trackIdNum);
        res.json({ message: 'Distribución automática activada para este track' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al activar distribución' });
    }
};
exports.activateAutoDistribute = activateAutoDistribute;
// ============================================
// DESACTIVAR DISTRIBUCIÓN AUTOMÁTICA
// ============================================
const deactivateAutoDistribute = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.params;
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
        database_1.default.prepare('UPDATE tracks SET auto_distribute = 0 WHERE id = ?').run(trackIdNum);
        res.json({ message: 'Distribución automática desactivada' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al desactivar distribución' });
    }
};
exports.deactivateAutoDistribute = deactivateAutoDistribute;
// ============================================
// LISTAR DISTRIBUCIONES DE UN TRACK
// ============================================
const getDistributions = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.params;
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
        const distributions = database_1.default.prepare(`
      SELECT * FROM store_distributions
      WHERE track_id = ?
      ORDER BY created_at DESC
    `).all(trackIdNum);
        res.json(distributions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener distribuciones' });
    }
};
exports.getDistributions = getDistributions;
// ============================================
// (OPCIONAL) FORZAR DISTRIBUCIÓN AHORA (para pruebas)
// ============================================
const forceDistribute = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.params;
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
        // Simular distribución a todas las tiendas no enviadas aún
        const existing = database_1.default.prepare('SELECT store_name FROM store_distributions WHERE track_id = ?').all(trackIdNum);
        const existingStores = new Set(existing.map(e => e.store_name));
        const insert = database_1.default.prepare(`
      INSERT INTO store_distributions (track_id, store_name, status, sent_at)
      VALUES (?, ?, 'sent', ?)
    `);
        const now = new Date().toISOString();
        for (const store of stores_1.STORES) {
            if (!existingStores.has(store.name)) {
                insert.run(trackIdNum, store.name, now);
            }
        }
        res.json({ message: 'Distribución forzada completada' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al forzar distribución' });
    }
};
exports.forceDistribute = forceDistribute;
