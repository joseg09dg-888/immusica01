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
exports.publishVideo = exports.deleteVideo = exports.updateVideo = exports.getVideoById = exports.getMyVideos = exports.uploadVideo = void 0;
const database_1 = __importDefault(require("../database"));
const ArtistModel = __importStar(require("../models/Artist"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configurar multer para subida de videos
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/videos');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Formato de video no permitido. Solo MP4, MOV, AVI'));
        }
    }
});
// ============================================
// SUBIR VIDEO
// ============================================
exports.uploadVideo = [
    upload.single('video'),
    async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'No autorizado' });
            if (!req.file)
                return res.status(400).json({ error: 'No se subió ningún video' });
            const { title, description, track_id, tags } = req.body;
            if (!title) {
                return res.status(400).json({ error: 'El título es obligatorio' });
            }
            const artists = ArtistModel.getArtistsByUser(req.user.id);
            if (artists.length === 0)
                return res.status(404).json({ error: 'Artista no encontrado' });
            const artistId = artists[0].id;
            let tagsJson = null;
            if (tags) {
                if (Array.isArray(tags)) {
                    tagsJson = JSON.stringify(tags);
                }
                else if (typeof tags === 'string') {
                    const tagsArray = tags.split(',').map(t => t.trim());
                    tagsJson = JSON.stringify(tagsArray);
                }
            }
            const videoUrl = `/uploads/videos/${req.file.filename}`;
            const insert = database_1.default.prepare(`
        INSERT INTO videos (artist_id, track_id, title, description, video_url, tags, status)
        VALUES (?, ?, ?, ?, ?, ?, 'draft')
      `);
            const result = insert.run(artistId, track_id || null, title, description || null, videoUrl, tagsJson);
            res.status(201).json({
                id: result.lastInsertRowid,
                video_url: videoUrl,
                message: 'Video subido correctamente'
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al subir video' });
        }
    }
];
// ============================================
// OBTENER VIDEOS DEL ARTISTA
// ============================================
const getMyVideos = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.json([]);
        const artistId = artists[0].id;
        const videos = database_1.default.prepare(`
      SELECT v.*, t.title as track_title
      FROM videos v
      LEFT JOIN tracks t ON v.track_id = t.id
      WHERE v.artist_id = ?
      ORDER BY v.created_at DESC
    `).all(artistId);
        videos.forEach((v) => {
            if (v.tags)
                v.tags = JSON.parse(v.tags);
            if (v.platform_status)
                v.platform_status = JSON.parse(v.platform_status);
        });
        res.json(videos);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener videos' });
    }
};
exports.getMyVideos = getMyVideos;
// ============================================
// OBTENER VIDEO POR ID
// ============================================
const getVideoById = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const video = database_1.default.prepare(`
      SELECT v.*, t.title as track_title
      FROM videos v
      LEFT JOIN tracks t ON v.track_id = t.id
      WHERE v.id = ? AND v.artist_id = ?
    `).get(id, artistId);
        if (!video) {
            return res.status(404).json({ error: 'Video no encontrado' });
        }
        if (video.tags)
            video.tags = JSON.parse(video.tags);
        if (video.platform_status)
            video.platform_status = JSON.parse(video.platform_status);
        res.json(video);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener video' });
    }
};
exports.getVideoById = getVideoById;
// ============================================
// ACTUALIZAR VIDEO
// ============================================
const updateVideo = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const { title, description, track_id, tags } = req.body;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const video = database_1.default.prepare('SELECT id FROM videos WHERE id = ? AND artist_id = ?').get(id, artistId);
        if (!video) {
            return res.status(404).json({ error: 'Video no encontrado' });
        }
        const fields = [];
        const params = [];
        if (title) {
            fields.push('title = ?');
            params.push(title);
        }
        if (description !== undefined) {
            fields.push('description = ?');
            params.push(description);
        }
        if (track_id !== undefined) {
            fields.push('track_id = ?');
            params.push(track_id || null);
        }
        if (tags) {
            let tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : tags;
            fields.push('tags = ?');
            params.push(tagsJson);
        }
        fields.push('updated_at = CURRENT_TIMESTAMP');
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }
        params.push(id);
        database_1.default.prepare(`UPDATE videos SET ${fields.join(', ')} WHERE id = ?`).run(...params);
        res.json({ message: 'Video actualizado correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar video' });
    }
};
exports.updateVideo = updateVideo;
// ============================================
// ELIMINAR VIDEO
// ============================================
const deleteVideo = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        // Tipamos el resultado de la consulta
        const video = database_1.default.prepare('SELECT video_url FROM videos WHERE id = ? AND artist_id = ?').get(id, artistId);
        if (!video) {
            return res.status(404).json({ error: 'Video no encontrado' });
        }
        if (video.video_url) {
            const filePath = path_1.default.join(__dirname, '../..', video.video_url);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        database_1.default.prepare('DELETE FROM videos WHERE id = ?').run(id);
        res.json({ message: 'Video eliminado correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar video' });
    }
};
exports.deleteVideo = deleteVideo;
// ============================================
// PUBLICAR VIDEO (simular envío a plataformas)
// ============================================
const publishVideo = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'No autorizado' });
        const { id } = req.params;
        const { youtube_url, vevo_url } = req.body;
        const artists = ArtistModel.getArtistsByUser(req.user.id);
        if (artists.length === 0)
            return res.status(404).json({ error: 'Artista no encontrado' });
        const artistId = artists[0].id;
        const video = database_1.default.prepare('SELECT id FROM videos WHERE id = ? AND artist_id = ?').get(id, artistId);
        if (!video) {
            return res.status(404).json({ error: 'Video no encontrado' });
        }
        const now = new Date().toISOString();
        database_1.default.prepare(`
      UPDATE videos
      SET status = 'published',
          youtube_url = ?,
          vevo_url = ?,
          published_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(youtube_url || null, vevo_url || null, now, id);
        res.json({ message: 'Video publicado correctamente' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al publicar video' });
    }
};
exports.publishVideo = publishVideo;
