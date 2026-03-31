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
exports.releaseWithholding = exports.getMyWithholdings = exports.getWithholdingsByTrack = exports.getAllRoyalties = exports.uploadRoyalties = exports.getSummary = void 0;
const ArtistModel = __importStar(require("../models/Artist"));
const RoyaltyModel = __importStar(require("../models/Royalty"));
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const database_1 = __importDefault(require("../database"));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// ============================================
// FUNCIÓN AUXILIAR: Procesar splits y retenciones
// ============================================
const processSplitsForRoyalty = (trackId, cantidad) => {
    try {
        const splits = database_1.default.prepare(`
      SELECT * FROM splits WHERE track_id = ? AND status = "accepted"
    `).all(trackId);
        if (splits.length === 0)
            return;
        const totalSplits = splits.reduce((sum, s) => sum + s.percentage, 0);
        if (totalSplits > 0) {
            const retenido = (cantidad * totalSplits) / 100;
            database_1.default.prepare(`
        INSERT INTO royalty_withholdings (track_id, cantidad, estado)
        VALUES (?, ?, 'retenido')
      `).run(trackId, retenido);
            console.log(`Retenido ${retenido} para track ${trackId} por splits`);
        }
    }
    catch (error) {
        console.error('Error procesando splits:', error);
    }
};
// ============================================
// RESUMEN DE REGALÍAS
// ============================================
const getSummary = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        let artistId;
        if (req.user.role !== 'admin') {
            const artists = ArtistModel.getArtistsByUser(req.user.id);
            if (artists.length === 0)
                return res.json({ total: 0, byPlatform: {}, byMonth: {} });
            artistId = artists[0].id;
        }
        const summary = RoyaltyModel.getSummary(artistId);
        res.json(summary);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener resumen' });
    }
};
exports.getSummary = getSummary;
// ============================================
// SUBIR CSV DE REGALÍAS
// ============================================
exports.uploadRoyalties = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            const results = [];
            fs_1.default.createReadStream(req.file.path)
                .pipe((0, csv_parser_1.default)())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                if (req.file && fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                for (const row of results) {
                    if (!row.fecha || !row.plataforma || !row.cantidad) {
                        console.warn('Fila incompleta, se omite:', row);
                        continue;
                    }
                    let trackId = null;
                    if (row.track_id) {
                        trackId = parseInt(row.track_id, 10);
                    }
                    else if (row.track_title) {
                        // Buscar el track por título (solo para el artista autenticado)
                        const artists = ArtistModel.getArtistsByUser(req.user.id);
                        if (artists.length > 0) {
                            const artistId = artists[0].id;
                            // Consulta directa a la base de datos en lugar de usar getAllTracks
                            const track = database_1.default.prepare(`
                  SELECT id FROM tracks WHERE artist_id = ? AND title = ?
                `).get(artistId, row.track_title);
                            if (track) {
                                trackId = track.id;
                            }
                        }
                    }
                    if (!trackId) {
                        console.warn('No se pudo determinar el track para la fila:', row);
                        continue;
                    }
                    // Insertar la regalía
                    RoyaltyModel.createRoyalty({
                        fecha: row.fecha,
                        plataforma: row.plataforma,
                        tipo: row.tipo || null,
                        cantidad: parseFloat(row.cantidad),
                        track_id: trackId,
                        concepto: row.concepto || null,
                        estado: row.estado || 'proyectado'
                    });
                    // Procesar splits y retenciones
                    processSplitsForRoyalty(trackId, parseFloat(row.cantidad));
                }
                res.json({ message: 'Archivo procesado correctamente', filas: results.length });
            })
                .on('error', (err) => {
                console.error(err);
                res.status(500).json({ error: 'Error al leer el archivo CSV' });
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al procesar el archivo' });
        }
    }
];
// ============================================
// OBTENER TODAS LAS REGALÍAS (SOLO ADMIN)
// ============================================
const getAllRoyalties = (req, res) => {
    if (req.user?.role !== 'admin')
        return res.status(403).json({ error: 'Prohibido' });
    const royalties = RoyaltyModel.getAllRoyalties();
    res.json(royalties);
};
exports.getAllRoyalties = getAllRoyalties;
// ============================================
// RETENCIONES (WITHHOLDINGS)
// ============================================
const getWithholdingsByTrack = (req, res) => {
    const { trackId } = req.params;
    if (!trackId)
        return res.status(400).json({ error: 'trackId requerido' });
    try {
        const withholdings = database_1.default.prepare('SELECT * FROM royalty_withholdings WHERE track_id = ?').all(trackId);
        res.json(withholdings);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener retenciones' });
    }
};
exports.getWithholdingsByTrack = getWithholdingsByTrack;
const getMyWithholdings = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.json([]);
        const artistId = artists[0].id;
        const tracks = database_1.default.prepare(`
      SELECT t.id 
      FROM tracks t
      WHERE t.artist_id = ?
    `).all(artistId);
        const trackIds = tracks.map(t => t.id);
        if (trackIds.length === 0)
            return res.json([]);
        const placeholders = trackIds.map(() => '?').join(',');
        const withholdings = database_1.default.prepare(`
      SELECT * FROM royalty_withholdings WHERE track_id IN (${placeholders})
    `).all(...trackIds);
        res.json(withholdings);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener retenciones' });
    }
};
exports.getMyWithholdings = getMyWithholdings;
const releaseWithholding = (req, res) => {
    const { withholdingId } = req.params;
    try {
        const withholding = database_1.default.prepare('SELECT * FROM royalty_withholdings WHERE id = ?').get(withholdingId);
        if (!withholding)
            return res.status(404).json({ error: 'Retención no encontrada' });
        database_1.default.prepare(`
      UPDATE royalty_withholdings SET estado = "liberado", released_at = ? WHERE id = ?
    `).run(new Date().toISOString(), withholdingId);
        res.json({ message: 'Retención liberada' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al liberar retención' });
    }
};
exports.releaseWithholding = releaseWithholding;
