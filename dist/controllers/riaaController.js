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
exports.getCertificationHistory = exports.getCertificationStatus = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
// Umbrales de certificación RIAA (en unidades equivalentes a streams)
const RIAA_THRESHOLDS = {
    silver: 100000,
    gold: 500000,
    platinum: 1000000,
    multi_platinum: 2000000,
    diamond: 10000000
};
// ============================================
// Obtener el estado de certificación de un artista
// ============================================
const getCertificationStatus = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        // Obtener el artista principal del usuario (o el que se pase por query)
        let artistId;
        const queryArtistId = req.query.artistId;
        if (queryArtistId !== undefined) {
            // Convertir queryArtistId a string de manera segura
            let artistIdStr;
            if (typeof queryArtistId === 'string') {
                artistIdStr = queryArtistId;
            }
            else if (Array.isArray(queryArtistId) && queryArtistId.length > 0 && typeof queryArtistId[0] === 'string') {
                artistIdStr = queryArtistId[0];
            }
            else {
                return res.status(400).json({ error: 'ID de artista inválido' });
            }
            artistId = parseInt(artistIdStr, 10);
            if (isNaN(artistId)) {
                return res.status(400).json({ error: 'ID de artista inválido' });
            }
            // Verificar que el usuario tiene acceso a ese artista
            const artists = ArtistModel.getArtistsByUser(req.user.id);
            if (!artists.some(a => a.id === artistId)) {
                return res.status(403).json({ error: 'No tienes acceso a este artista' });
            }
        }
        else {
            const artists = ArtistModel.getArtistsByUser(req.user.id);
            if (artists.length === 0)
                return res.status(404).json({ error: 'Artista no encontrado' });
            artistId = artists[0].id;
        }
        // Calcular total de streams del artista (desde daily_stats)
        const totalStreamsRow = database_1.default.prepare(`
      SELECT SUM(streams) as totalStreams, SUM(ingresos) as totalIngresos
      FROM daily_stats ds
      JOIN tracks t ON ds.track_id = t.id
      WHERE t.artist_id = ?
    `).get(artistId);
        const totalStreams = totalStreamsRow?.totalStreams || 0;
        const totalIngresos = totalStreamsRow?.totalIngresos || 0;
        // Determinar las certificaciones alcanzadas
        const certifications = [];
        for (const [type, threshold] of Object.entries(RIAA_THRESHOLDS)) {
            if (totalStreams >= threshold) {
                // Verificar si ya está registrada en la base de datos
                const existing = database_1.default.prepare(`
          SELECT * FROM riaa_certifications
          WHERE artist_id = ? AND certification_type = ?
        `).get(artistId, type);
                if (!existing) {
                    // Registrar la certificación
                    database_1.default.prepare(`
            INSERT INTO riaa_certifications (artist_id, certification_type, threshold, achieved_at)
            VALUES (?, ?, ?, ?)
          `).run(artistId, type, threshold, new Date().toISOString());
                }
                certifications.push({
                    type,
                    achieved: true,
                    threshold,
                    achievedAt: existing?.achieved_at || new Date().toISOString()
                });
            }
            else {
                certifications.push({ type, achieved: false, threshold });
            }
        }
        res.json({
            artistId,
            totalStreams,
            totalIngresos,
            certifications
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estado de certificación' });
    }
};
exports.getCertificationStatus = getCertificationStatus;
// ============================================
// Obtener certificaciones históricas de un artista
// ============================================
const getCertificationHistory = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { artistId } = req.params;
        // Manejar si artistId es un array (poco probable, pero por seguridad)
        const artistIdStr = Array.isArray(artistId) ? artistId[0] : artistId;
        const artistIdNum = parseInt(artistIdStr, 10);
        if (isNaN(artistIdNum)) {
            return res.status(400).json({ error: 'ID de artista inválido' });
        }
        // Verificar acceso
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (!artists.some(a => a.id === artistIdNum)) {
            return res.status(403).json({ error: 'No tienes acceso a este artista' });
        }
        const certifications = database_1.default.prepare(`
      SELECT * FROM riaa_certifications
      WHERE artist_id = ?
      ORDER BY achieved_at DESC
    `).all(artistIdNum);
        res.json(certifications);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener historial de certificaciones' });
    }
};
exports.getCertificationHistory = getCertificationHistory;
