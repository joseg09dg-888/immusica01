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
exports.exportLyrics = exports.deleteLyrics = exports.getLyrics = exports.uploadPlainLyrics = exports.uploadLyrics = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
const TrackModel = __importStar(require("../models/Track"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
// Configurar multer para subida de archivos .lrc
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/lyrics');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'lyrics-' + uniqueSuffix + '.lrc');
    }
});
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/plain' || file.originalname.endsWith('.lrc')) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten archivos .lrc o .txt'));
        }
    }
});
// ============================================
// SUBIR LETRAS SINCRONIZADAS (.lrc)
// ============================================
exports.uploadLyrics = [
    upload.single('lyrics'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            const { trackId, language } = req.body;
            if (!trackId) {
                return res.status(400).json({ error: 'trackId es obligatorio' });
            }
            // Validar que trackId sea un string y convertirlo a número
            const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
            const trackIdNum = parseInt(trackIdStr, 10);
            if (isNaN(trackIdNum)) {
                return res.status(400).json({ error: 'trackId inválido' });
            }
            // Verificar que el track pertenece al artista
            const artists = ArtistModel.getArtistsByUser(req.user.id);
            if (artists.length === 0)
                return res.status(404).json({ error: 'Artista no encontrado' });
            const artistId = artists[0].id;
            const track = TrackModel.getTrackById(trackIdNum);
            if (!track || track.artist_id !== artistId) {
                return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
            }
            // Leer el archivo subido
            const filePath = req.file.path;
            const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
            // Determinar si es letra sincronizada (contiene timestamps [mm:ss.xx])
            const isSynced = /\[\d{2}:\d{2}\.\d{2}\]/.test(fileContent);
            // Guardar en base de datos
            const insert = database_1.default.prepare(`
        INSERT INTO track_lyrics (track_id, synced_lyrics, lyrics_text, language, is_synced)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(track_id) DO UPDATE SET
          synced_lyrics = excluded.synced_lyrics,
          lyrics_text = excluded.lyrics_text,
          language = excluded.language,
          is_synced = excluded.is_synced,
          updated_at = CURRENT_TIMESTAMP
      `);
            insert.run(trackIdNum, isSynced ? fileContent : null, !isSynced ? fileContent : null, language || null, isSynced ? 1 : 0);
            res.json({
                message: 'Letras subidas correctamente',
                isSynced,
                trackId: trackIdNum
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al subir letras' });
        }
    }
];
// ============================================
// SUBIR LETRA TEXTO PLANO (no sincronizada)
// ============================================
const uploadPlainLyrics = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId, lyrics, language } = req.body;
        if (!trackId || !lyrics) {
            return res.status(400).json({ error: 'trackId y lyrics son obligatorios' });
        }
        // Validar trackId
        const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
        const trackIdNum = parseInt(trackIdStr, 10);
        if (isNaN(trackIdNum)) {
            return res.status(400).json({ error: 'trackId inválido' });
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
        // Guardar en base de datos
        const insert = database_1.default.prepare(`
      INSERT INTO track_lyrics (track_id, lyrics_text, language, is_synced)
      VALUES (?, ?, ?, 0)
      ON CONFLICT(track_id) DO UPDATE SET
        lyrics_text = excluded.lyrics_text,
        language = excluded.language,
        is_synced = 0,
        synced_lyrics = NULL,
        updated_at = CURRENT_TIMESTAMP
    `);
        insert.run(trackIdNum, lyrics, language || null);
        res.json({
            message: 'Letra guardada correctamente',
            trackId: trackIdNum
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al guardar letra' });
    }
};
exports.uploadPlainLyrics = uploadPlainLyrics;
// ============================================
// OBTENER LETRAS DE UN TRACK
// ============================================
const getLyrics = (req, res) => {
    const { trackId } = req.params;
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
        return res.status(400).json({ error: 'trackId inválido' });
    }
    try {
        const lyrics = database_1.default.prepare(`
      SELECT * FROM track_lyrics WHERE track_id = ?
    `).get(trackIdNum);
        if (!lyrics) {
            return res.status(404).json({ error: 'Este track no tiene letras' });
        }
        res.json(lyrics);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener letras' });
    }
};
exports.getLyrics = getLyrics;
// ============================================
// ELIMINAR LETRAS DE UN TRACK
// ============================================
const deleteLyrics = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { trackId } = req.params;
        const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
        const trackIdNum = parseInt(trackIdStr, 10);
        if (isNaN(trackIdNum)) {
            return res.status(400).json({ error: 'trackId inválido' });
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
        database_1.default.prepare('DELETE FROM track_lyrics WHERE track_id = ?').run(trackIdNum);
        res.json({ message: 'Letras eliminadas correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar letras' });
    }
};
exports.deleteLyrics = deleteLyrics;
// ============================================
// EXPORTAR LETRAS PARA PLATAFORMAS (formato LRC)
// ============================================
const exportLyrics = (req, res) => {
    const { trackId } = req.params;
    const { format } = req.query; // lrc, txt, json
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
        return res.status(400).json({ error: 'trackId inválido' });
    }
    try {
        const lyrics = database_1.default.prepare(`
      SELECT * FROM track_lyrics WHERE track_id = ?
    `).get(trackIdNum);
        if (!lyrics) {
            return res.status(404).json({ error: 'No hay letras para este track' });
        }
        // Si hay letras sincronizadas y se pide formato lrc, devolver archivo
        if (lyrics.synced_lyrics && format === 'lrc') {
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="track-${trackIdNum}.lrc"`);
            return res.send(lyrics.synced_lyrics);
        }
        // Si no, devolver JSON con las letras
        res.json(lyrics);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al exportar letras' });
    }
};
exports.exportLyrics = exportLyrics;
