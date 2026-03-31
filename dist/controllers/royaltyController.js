"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseWithholding = exports.getMyWithholdings = exports.getWithholdingsByTrack = exports.getAllRoyalties = exports.uploadRoyalties = exports.getSummary = void 0;
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const database_1 = __importDefault(require("../database"));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// Función auxiliar para obtener un string seguro de req.params
const getParamAsString = (param) => {
    if (Array.isArray(param))
        return param[0];
    return param || '';
};
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
        // Obtener el artist_id del usuario actual
        const userArtists = database_1.default.prepare(`
      SELECT artist_id FROM user_artists WHERE user_id = ? AND role = 'owner'
    `).all(req.user.id);
        if (userArtists.length === 0) {
            return res.json({ total: 0, byPlatform: {}, byMonth: {} });
        }
        const artistId = userArtists[0].artist_id;
        const royalties = database_1.default.prepare(`
      SELECT * FROM royalties WHERE track_id IN (SELECT id FROM tracks WHERE artist_id = ?)
    `).all(artistId);
        const total = royalties.reduce((acc, r) => acc + r.cantidad, 0);
        const byPlatform = {};
        const byMonth = {};
        royalties.forEach(r => {
            byPlatform[r.plataforma] = (byPlatform[r.plataforma] || 0) + r.cantidad;
            const month = r.fecha.substring(0, 7);
            byMonth[month] = (byMonth[month] || 0) + r.cantidad;
        });
        res.json({ total, byPlatform, byMonth });
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
            const userArtists = database_1.default.prepare(`
        SELECT artist_id FROM user_artists WHERE user_id = ? AND role = 'owner'
      `).all(req.user.id);
            if (userArtists.length === 0) {
                return res.status(404).json({ error: 'El usuario no tiene un artista asociado' });
            }
            const artistId = userArtists[0].artist_id;
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
                        const track = database_1.default.prepare(`
                SELECT id FROM tracks WHERE artist_id = ? AND title = ?
              `).get(artistId, row.track_title);
                        if (track) {
                            trackId = track.id;
                        }
                    }
                    if (!trackId) {
                        console.warn('No se pudo determinar el track para la fila:', row);
                        continue;
                    }
                    database_1.default.prepare(`
              INSERT INTO royalties (track_id, fecha, plataforma, cantidad, estado)
              VALUES (?, ?, ?, ?, ?)
            `).run(trackId, row.fecha, row.plataforma, parseFloat(row.cantidad), row.estado || 'proyectado');
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
    const royalties = database_1.default.prepare('SELECT * FROM royalties').all();
    res.json(royalties);
};
exports.getAllRoyalties = getAllRoyalties;
// ============================================
// RETENCIONES
// ============================================
const getWithholdingsByTrack = (req, res) => {
    const trackIdParam = getParamAsString(req.params.trackId);
    const trackId = parseInt(trackIdParam, 10);
    if (isNaN(trackId))
        return res.status(400).json({ error: 'ID de track inválido' });
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
        const userArtists = database_1.default.prepare(`
      SELECT artist_id FROM user_artists WHERE user_id = ? AND role = 'owner'
    `).all(req.user.id);
        if (userArtists.length === 0)
            return res.json([]);
        const artistId = userArtists[0].artist_id;
        const tracks = database_1.default.prepare(`
      SELECT id FROM tracks WHERE artist_id = ?
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
    const idParam = getParamAsString(req.params.withholdingId);
    const id = parseInt(idParam, 10);
    if (isNaN(id))
        return res.status(400).json({ error: 'ID inválido' });
    try {
        const withholding = database_1.default.prepare('SELECT * FROM royalty_withholdings WHERE id = ?').get(id);
        if (!withholding)
            return res.status(404).json({ error: 'Retención no encontrada' });
        database_1.default.prepare(`
      UPDATE royalty_withholdings SET estado = "liberado", released_at = ? WHERE id = ?
    `).run(new Date().toISOString(), id);
        res.json({ message: 'Retención liberada' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al liberar retención' });
    }
};
exports.releaseWithholding = releaseWithholding;
