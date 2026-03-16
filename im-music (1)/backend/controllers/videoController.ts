import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getVideos = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const videos = db.prepare('SELECT * FROM videos WHERE artist_id IN (SELECT id FROM artists WHERE user_id = ?)').all(req.user.id);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener videos' });
  }
};

export const uploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.file) return res.status(400).json({ error: 'Faltan datos' });
    const { artist_id, title, platform } = req.body;
    const video_url = req.file.path;
    const result = db.prepare('INSERT INTO videos (artist_id, title, video_url, platform, status) VALUES (?, ?, ?, ?, ?)').run(artist_id, title, video_url, platform, 'published');
    res.json({ id: result.lastInsertRowid, url: video_url });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir video' });
  }
};

export const deleteVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.params;
    db.prepare('DELETE FROM videos WHERE id = ? AND artist_id IN (SELECT id FROM artists WHERE user_id = ?)').run(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar video' });
  }
};

export const updateVideo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.params;
    const { title, platform, status } = req.body;
    db.prepare('UPDATE videos SET title = ?, platform = ?, status = ? WHERE id = ? AND artist_id IN (SELECT id FROM artists WHERE user_id = ?)').run(title, platform, status, id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar video' });
  }
};
