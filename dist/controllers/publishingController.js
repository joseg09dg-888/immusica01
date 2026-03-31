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
exports.getPublishingSummary = exports.addPublishingRoyalty = exports.registerWithPRO = exports.assignCompositionSplits = exports.createComposition = exports.getComposers = exports.createComposer = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
const proIntegrationService_1 = require("../services/proIntegrationService");
// ============================================
// GESTIÓN DE COMPOSITORES
// ============================================
const createComposer = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { full_name, email, pro_affiliation, pro_number, ipi } = req.body;
        if (!full_name) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }
        const insert = database_1.default.prepare(`
      INSERT INTO composers (full_name, email, pro_affiliation, pro_number, ipi)
      VALUES (?, ?, ?, ?, ?)
    `);
        const result = insert.run(full_name, email || null, pro_affiliation || null, pro_number || null, ipi || null);
        res.status(201).json({
            id: result.lastInsertRowid,
            message: 'Compositor creado correctamente'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear compositor' });
    }
};
exports.createComposer = createComposer;
const getComposers = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const userComposers = database_1.default.prepare(`
      SELECT c.* FROM composers c
      WHERE c.user_id = ?
    `).all(req.user.id);
        const externalComposers = database_1.default.prepare(`
      SELECT DISTINCT c.* FROM composers c
      JOIN composition_splits cs ON c.id = cs.composer_id
      JOIN compositions comp ON cs.composition_id = comp.id
      JOIN track_compositions tc ON comp.id = tc.composition_id
      JOIN tracks t ON tc.track_id = t.id
      JOIN artists a ON t.artist_id = a.id
      WHERE a.user_id = ? AND c.user_id IS NULL
    `).all(req.user.id);
        res.json({
            userComposers,
            externalComposers
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener compositores' });
    }
};
exports.getComposers = getComposers;
// ============================================
// GESTIÓN DE OBRAS (COMPOSICIONES)
// ============================================
const createComposition = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { title, language, duration_seconds, lyrics, track_ids } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }
        const insertComposition = database_1.default.prepare(`
      INSERT INTO compositions (title, language, duration_seconds, lyrics)
      VALUES (?, ?, ?, ?)
    `);
        const result = insertComposition.run(title, language || null, duration_seconds || null, lyrics || null);
        const compositionId = result.lastInsertRowid;
        if (track_ids && Array.isArray(track_ids)) {
            const insertTrackComp = database_1.default.prepare(`
        INSERT INTO track_compositions (track_id, composition_id)
        VALUES (?, ?)
      `);
            for (const trackId of track_ids) {
                insertTrackComp.run(trackId, compositionId);
            }
        }
        res.status(201).json({
            id: compositionId,
            message: 'Composición creada correctamente'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear composición' });
    }
};
exports.createComposition = createComposition;
const assignCompositionSplits = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { compositionId } = req.params;
        const { splits } = req.body; // Array de { composer_id, role, percentage }
        if (!splits || !Array.isArray(splits)) {
            return res.status(400).json({ error: 'Splits debe ser un array' });
        }
        const total = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
        if (Math.abs(total - 100) > 0.01) {
            return res.status(400).json({ error: 'La suma de porcentajes debe ser 100%' });
        }
        database_1.default.prepare('DELETE FROM composition_splits WHERE composition_id = ?').run(compositionId);
        const insertSplit = database_1.default.prepare(`
      INSERT INTO composition_splits (composition_id, composer_id, role, percentage)
      VALUES (?, ?, ?, ?)
    `);
        for (const split of splits) {
            insertSplit.run(compositionId, split.composer_id, split.role || 'composer', split.percentage);
        }
        res.json({ message: 'Splits asignados correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al asignar splits' });
    }
};
exports.assignCompositionSplits = assignCompositionSplits;
// ============================================
// REGISTRO EN SOCIEDADES DE GESTIÓN (PROs)
// ============================================
const registerWithPRO = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { compositionId } = req.params;
        const { pro_name } = req.body;
        if (!pro_name) {
            return res.status(400).json({ error: 'Nombre de PRO es obligatorio' });
        }
        // Obtener datos de la composición y splits, con tipado explícito
        const composition = database_1.default.prepare(`
      SELECT c.*, 
      GROUP_CONCAT(cs.role || ':' || cs.percentage || ':' || comp.full_name || ':' || comp.pro_number) as composer_data
      FROM compositions c
      LEFT JOIN composition_splits cs ON c.id = cs.composition_id
      LEFT JOIN composers comp ON cs.composer_id = comp.id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(compositionId);
        if (!composition) {
            return res.status(404).json({ error: 'Composición no encontrada' });
        }
        // Parsear composer_data para construir el array de compositores
        const composers = [];
        if (composition.composer_data) {
            const parts = composition.composer_data.split(',');
            for (const p of parts) {
                const [role, percentage, name, proNumber] = p.split(':');
                composers.push({
                    name,
                    role,
                    share: parseFloat(percentage),
                    pro: proNumber || undefined
                });
            }
        }
        const submissionData = {
            workTitle: composition.title,
            iswc: composition.iswc || undefined,
            composers
        };
        const result = await proIntegrationService_1.PROIntegrationService.submitToPRO(pro_name, submissionData);
        database_1.default.prepare(`
      INSERT INTO composition_registrations 
      (composition_id, pro_name, registration_number, status, response_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(compositionId, pro_name, result.registration_number || `REG-${Date.now()}`, 'pending', JSON.stringify(result));
        res.json({
            message: `Composición enviada a ${pro_name}`,
            result
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar en PRO' });
    }
};
exports.registerWithPRO = registerWithPRO;
// ============================================
// RECAUDACIÓN Y DISTRIBUCIÓN
// ============================================
const addPublishingRoyalty = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { composition_id, track_id, fecha, plataforma, tipo, cantidad, territorio, uso_categoria } = req.body;
        if (!composition_id || !fecha || !plataforma || !cantidad) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        const insertRoyalty = database_1.default.prepare(`
      INSERT INTO publishing_royalties 
      (composition_id, track_id, fecha, plataforma, tipo, cantidad, territorio, uso_categoria)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = insertRoyalty.run(composition_id, track_id || null, fecha, plataforma, tipo || null, cantidad, territorio || null, uso_categoria || null);
        const royaltyId = result.lastInsertRowid;
        const splits = database_1.default.prepare(`
      SELECT * FROM composition_splits 
      WHERE composition_id = ?
    `).all(composition_id);
        if (splits.length > 0) {
            const insertDist = database_1.default.prepare(`
        INSERT INTO publishing_distributions 
        (publishing_royalty_id, composer_id, amount, percentage_applied)
        VALUES (?, ?, ?, ?)
      `);
            for (const split of splits) {
                const amount = (cantidad * split.percentage) / 100;
                insertDist.run(royaltyId, split.composer_id, amount, split.percentage);
            }
        }
        res.status(201).json({
            id: royaltyId,
            message: 'Regalía editorial registrada'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar regalía editorial' });
    }
};
exports.addPublishingRoyalty = addPublishingRoyalty;
const getPublishingSummary = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.json({ total: 0, compositions: [] });
        const artistId = artists[0].id;
        const compositions = database_1.default.prepare(`
      SELECT DISTINCT c.*, 
      (SELECT SUM(pr.cantidad) FROM publishing_royalties pr WHERE pr.composition_id = c.id) as total_earned,
      (SELECT COUNT(*) FROM publishing_royalties pr WHERE pr.composition_id = c.id) as royalty_count
      FROM compositions c
      JOIN track_compositions tc ON c.id = tc.composition_id
      JOIN tracks t ON tc.track_id = t.id
      WHERE t.artist_id = ?
      ORDER BY c.created_at DESC
    `).all(artistId);
        const totals = database_1.default.prepare(`
      SELECT 
        SUM(pr.cantidad) as total_publishing,
        SUM(CASE WHEN pr.tipo = 'mechanical' THEN pr.cantidad ELSE 0 END) as mechanical_total,
        SUM(CASE WHEN pr.tipo = 'performance' THEN pr.cantidad ELSE 0 END) as performance_total,
        SUM(CASE WHEN pr.tipo = 'sync' THEN pr.cantidad ELSE 0 END) as sync_total
      FROM publishing_royalties pr
      JOIN track_compositions tc ON pr.composition_id = tc.composition_id
      JOIN tracks t ON tc.track_id = t.id
      WHERE t.artist_id = ?
    `).get(artistId);
        res.json({
            total_publishing: totals?.total_publishing || 0,
            mechanical_total: totals?.mechanical_total || 0,
            performance_total: totals?.performance_total || 0,
            sync_total: totals?.sync_total || 0,
            compositions
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener resumen editorial' });
    }
};
exports.getPublishingSummary = getPublishingSummary;
