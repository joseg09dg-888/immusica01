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
exports.listLegacyPurchases = exports.getLegacyStatus = exports.purchaseLegacyForAll = exports.purchaseLegacy = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
const TrackModel = __importStar(require("../models/Track"));
// ============================================
// COMPRAR LEAVE A LEGACY PARA UN TRACK
// ============================================
const purchaseLegacy = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId, amount } = req.body;
        if (!trackId) {
            return res.status(400).json({ error: 'trackId es obligatorio' });
        }
        const trackIdNum = parseInt(trackId, 10);
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
        // Verificar si ya es legacy
        if (track.is_legacy) {
            return res.status(400).json({ error: 'Este track ya tiene Leave a Legacy activo' });
        }
        const now = new Date().toISOString();
        // Registrar la compra
        const insertPurchase = database_1.default.prepare(`
      INSERT INTO legacy_purchases (user_id, artist_id, track_id, amount, purchase_date, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);
        const purchaseResult = insertPurchase.run(req.user.id, artistId, trackIdNum, amount || 49.99, now);
        const purchaseId = purchaseResult.lastInsertRowid;
        // Marcar el track como legacy
        database_1.default.prepare(`
      UPDATE tracks SET is_legacy = 1, legacy_purchased_at = ? WHERE id = ?
    `).run(now, trackIdNum);
        res.status(201).json({
            purchaseId,
            message: 'Leave a Legacy adquirido correctamente. Este track permanecerá publicado aunque canceles tu suscripción.'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la compra' });
    }
};
exports.purchaseLegacy = purchaseLegacy;
// ============================================
// COMPRAR LEAVE A LEGACY PARA TODO EL CATÁLOGO DEL ARTISTA
// ============================================
const purchaseLegacyForAll = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { amount } = req.body;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const now = new Date().toISOString();
        // Registrar compra general (sin track específico)
        const insertPurchase = database_1.default.prepare(`
      INSERT INTO legacy_purchases (user_id, artist_id, track_id, amount, purchase_date, status)
      VALUES (?, ?, NULL, ?, ?, 'active')
    `);
        const purchaseResult = insertPurchase.run(req.user.id, artistId, amount || 199.99, now);
        const purchaseId = purchaseResult.lastInsertRowid;
        // Marcar todos los tracks del artista como legacy
        database_1.default.prepare(`
      UPDATE tracks SET is_legacy = 1, legacy_purchased_at = ? WHERE artist_id = ?
    `).run(now, artistId);
        res.status(201).json({
            purchaseId,
            message: 'Leave a Legacy adquirido para todo tu catálogo.'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la compra' });
    }
};
exports.purchaseLegacyForAll = purchaseLegacyForAll;
// ============================================
// OBTENER ESTADO DE LEGACY DE UN TRACK
// ============================================
const getLegacyStatus = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.params;
        const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
        const trackIdNum = parseInt(trackIdStr, 10);
        if (isNaN(trackIdNum)) {
            return res.status(400).json({ error: 'ID de track inválido' });
        }
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const track = TrackModel.getTrackById(trackIdNum);
        if (!track || track.artist_id !== artistId) {
            return res.status(404).json({ error: 'Track no encontrado' });
        }
        res.json({
            trackId: trackIdNum,
            is_legacy: track.is_legacy || false,
            legacy_purchased_at: track.legacy_purchased_at || null
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estado' });
    }
};
exports.getLegacyStatus = getLegacyStatus;
// ============================================
// LISTAR COMPRAS DE LEGACY DEL ARTISTA
// ============================================
const listLegacyPurchases = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.json([]);
        const artistId = artists[0].id;
        const purchases = database_1.default.prepare(`
      SELECT lp.*, t.title as track_title
      FROM legacy_purchases lp
      LEFT JOIN tracks t ON lp.track_id = t.id
      WHERE lp.artist_id = ?
      ORDER BY lp.purchase_date DESC
    `).all(artistId);
        res.json(purchases);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al listar compras' });
    }
};
exports.listLegacyPurchases = listLegacyPurchases;
