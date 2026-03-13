import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configurar multer para subida de videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de video no permitido. Solo MP4, MOV, AVI'));
    }
  }
});

// Interfaces para tipos
interface VideoRow {
  id: number;
  artist_id: number;
  track_id: number | null;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  resolution: string | null;
  status: string;
  platform_status: string | null;
  youtube_url: string | null;
  vevo_url: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// ============================================
// SUBIR VIDEO
// ============================================
export const uploadVideo = [
  upload.single('video'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún video' });

      const { title, description, track_id, tags } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'El título es obligatorio' });
      }

      const artists = ArtistModel.getArtistsByUser(req.user.id);
      if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
      const artistId = artists[0].id;

      let tagsJson = null;
      if (tags) {
        if (Array.isArray(tags)) {
          tagsJson = JSON.stringify(tags);
        } else if (typeof tags === 'string') {
          const tagsArray = tags.split(',').map(t => t.trim());
          tagsJson = JSON.stringify(tagsArray);
        }
      }

      const videoUrl = `/uploads/videos/${req.file.filename}`;

      const insert = db.prepare(`
        INSERT INTO videos (artist_id, track_id, title, description, video_url, tags, status)
        VALUES (?, ?, ?, ?, ?, ?, 'draft')
      `);
      const result = insert.run(
        artistId,
        track_id || null,
        title,
        description || null,
        videoUrl,
        tagsJson
      );

      res.status(201).json({
        id: result.lastInsertRowid,
        video_url: videoUrl,
        message: 'Video subido correctamente'
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir video' });
    }
  }
];

// ============================================
// OBTENER VIDEOS DEL ARTISTA
// ============================================
export const getMyVideos = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;

    const videos = db.prepare(`
      SELECT v.*, t.title as track_title
      FROM videos v
      LEFT JOIN tracks t ON v.track_id = t.id
      WHERE v.artist_id = ?
      ORDER BY v.created_at DESC
    `).all(artistId) as any[];

    videos.forEach((v: any) => {
      if (v.tags) v.tags = JSON.parse(v.tags);
      if (v.platform_status) v.platform_status = JSON.parse(v.platform_status);
    });

    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener videos' });
  }
};

// ============================================
// OBTENER VIDEO POR ID
// ============================================
export const getVideoById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const video = db.prepare(`
      SELECT v.*, t.title as track_title
      FROM videos v
      LEFT JOIN tracks t ON v.track_id = t.id
      WHERE v.id = ? AND v.artist_id = ?
    `).get(id, artistId) as any;

    if (!video) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    if (video.tags) video.tags = JSON.parse(video.tags);
    if (video.platform_status) video.platform_status = JSON.parse(video.platform_status);

    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener video' });
  }
};

// ============================================
// ACTUALIZAR VIDEO
// ============================================
export const updateVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    const { title, description, track_id, tags } = req.body;

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const video = db.prepare('SELECT id FROM videos WHERE id = ? AND artist_id = ?').get(id, artistId) as any;
    if (!video) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (title) { fields.push('title = ?'); params.push(title); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (track_id !== undefined) { fields.push('track_id = ?'); params.push(track_id || null); }
    if (tags) {
      let tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : tags;
      fields.push('tags = ?'); params.push(tagsJson);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);
    db.prepare(`UPDATE videos SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    res.json({ message: 'Video actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar video' });
  }
};

// ============================================
// ELIMINAR VIDEO
// ============================================
export const deleteVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    // Tipamos el resultado de la consulta
    const video = db.prepare('SELECT video_url FROM videos WHERE id = ? AND artist_id = ?').get(id, artistId) as { video_url: string } | undefined;
    if (!video) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    if (video.video_url) {
      const filePath = path.join(__dirname, '../..', video.video_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.prepare('DELETE FROM videos WHERE id = ?').run(id);
    res.json({ message: 'Video eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar video' });
  }
};

// ============================================
// PUBLICAR VIDEO (simular envío a plataformas)
// ============================================
export const publishVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    const { youtube_url, vevo_url } = req.body;

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const video = db.prepare('SELECT id FROM videos WHERE id = ? AND artist_id = ?').get(id, artistId) as any;
    if (!video) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE videos
      SET status = 'published',
          youtube_url = ?,
          vevo_url = ?,
          published_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(youtube_url || null, vevo_url || null, now, id);

    res.json({ message: 'Video publicado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al publicar video' });
  }
};