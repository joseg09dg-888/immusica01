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
exports.getArtistTracks = exports.getArtistSummary = exports.getTrackStats = exports.uploadDailyStats = void 0;
const ArtistModel = __importStar(require("../models/Artist"));
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const database_1 = __importDefault(require("../database"));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// ============================================
// SUBIR ARCHIVO CSV DE ESTADÍSTICAS DIARIAS
// ============================================
exports.uploadDailyStats = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            // Obtener el artist_id del usuario autenticado
            const artists = ArtistModel.getArtistsByUser(req.user.id);
            if (artists.length === 0) {
                return res.status(404).json({ error: 'Artista no encontrado' });
            }
            const artistId = artists[0].id;
            const results = [];
            fs_1.default.createReadStream(req.file.path)
                .pipe((0, csv_parser_1.default)())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                // Eliminar archivo temporal
                if (req.file && fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                let filasProcesadas = 0;
                const errors = [];
                for (const row of results) {
                    // Validar campos obligatorios
                    if (!row.track_id || !row.fecha || !row.plataforma || (!row.streams && !row.ingresos)) {
                        errors.push(`Fila incompleta: ${JSON.stringify(row)}`);
                        continue;
                    }
                    // Verificar que el track pertenezca al artista
                    const track = database_1.default.prepare('SELECT id FROM tracks WHERE id = ? AND artist_id = ?').get(row.track_id, artistId);
                    if (!track) {
                        errors.push(`Track ID ${row.track_id} no pertenece al artista`);
                        continue;
                    }
                    // Insertar o reemplazar estadística
                    const streams = parseInt(row.streams) || 0;
                    const ingresos = parseFloat(row.ingresos) || 0;
                    database_1.default.prepare(`
              INSERT INTO daily_stats (track_id, fecha, plataforma, streams, ingresos)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(track_id, fecha, plataforma) 
              DO UPDATE SET 
                streams = excluded.streams,
                ingresos = excluded.ingresos,
                updated_at = CURRENT_TIMESTAMP
            `).run(row.track_id, row.fecha, row.plataforma, streams, ingresos);
                    filasProcesadas++;
                }
                res.json({
                    message: 'Archivo procesado',
                    filasProcesadas,
                    errores: errors.length > 0 ? errors : undefined
                });
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
// OBTENER ESTADÍSTICAS DE UN TRACK ESPECÍFICO
// ============================================
const getTrackStats = (req, res) => {
    const { trackId } = req.params;
    try {
        const stats = database_1.default.prepare(`
      SELECT * FROM daily_stats 
      WHERE track_id = ? 
      ORDER BY fecha DESC
    `).all(trackId);
        // Calcular totales
        const totalStreams = stats.reduce((sum, row) => sum + row.streams, 0);
        const totalIngresos = stats.reduce((sum, row) => sum + row.ingresos, 0);
        res.json({
            trackId,
            totalStreams,
            totalIngresos,
            stats
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};
exports.getTrackStats = getTrackStats;
// ============================================
// OBTENER RESUMEN GENERAL DEL ARTISTA
// ============================================
const getArtistSummary = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        // Obtener artist_id del usuario
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0) {
            return res.status(404).json({ error: 'Artista no encontrado' });
        }
        const artistId = artists[0].id;
        // Obtener todos los tracks del artista
        const tracks = database_1.default.prepare('SELECT id, title FROM tracks WHERE artist_id = ?').all(artistId);
        const trackIds = tracks.map(t => t.id);
        if (trackIds.length === 0) {
            return res.json({
                totalStreams: 0,
                totalIngresos: 0,
                porPlataforma: [],
                porMes: [],
                recentStats: [],
                tracks: []
            });
        }
        // Construir placeholders para IN query
        const placeholders = trackIds.map(() => '?').join(',');
        // Estadísticas totales
        const totalsRow = database_1.default.prepare(`
      SELECT 
        SUM(streams) as totalStreams,
        SUM(ingresos) as totalIngresos
      FROM daily_stats 
      WHERE track_id IN (${placeholders})
    `).get(...trackIds);
        const totalStreams = totalsRow?.totalStreams || 0;
        const totalIngresos = totalsRow?.totalIngresos || 0;
        // Agrupar por plataforma
        const byPlatform = database_1.default.prepare(`
      SELECT 
        plataforma,
        SUM(streams) as streams,
        SUM(ingresos) as ingresos
      FROM daily_stats 
      WHERE track_id IN (${placeholders})
      GROUP BY plataforma
    `).all(...trackIds);
        // Agrupar por mes (YYYY-MM)
        const byMonth = database_1.default.prepare(`
      SELECT 
        substr(fecha, 1, 7) as mes,
        SUM(streams) as streams,
        SUM(ingresos) as ingresos
      FROM daily_stats 
      WHERE track_id IN (${placeholders})
      GROUP BY substr(fecha, 1, 7)
      ORDER BY mes DESC
    `).all(...trackIds);
        // Últimas 30 estadísticas
        const recentStats = database_1.default.prepare(`
      SELECT ds.*, t.title
      FROM daily_stats ds
      JOIN tracks t ON ds.track_id = t.id
      WHERE ds.track_id IN (${placeholders})
      ORDER BY ds.fecha DESC
      LIMIT 30
    `).all(...trackIds);
        res.json({
            totalStreams,
            totalIngresos,
            porPlataforma: byPlatform,
            porMes: byMonth,
            recentStats,
            tracks
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener resumen' });
    }
};
exports.getArtistSummary = getArtistSummary;
// ============================================
// OBTENER LISTA DE TRACKS DEL ARTISTA (para selects)
// ============================================
const getArtistTracks = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0) {
            return res.status(404).json({ error: 'Artista no encontrado' });
        }
        const artistId = artists[0].id;
        const tracks = database_1.default.prepare(`
      SELECT id, title, release_date 
      FROM tracks 
      WHERE artist_id = ?
      ORDER BY created_at DESC
    `).all(artistId);
        res.json(tracks);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener tracks' });
    }
};
exports.getArtistTracks = getArtistTracks;
