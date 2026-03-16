import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getLyrics = async (req: AuthRequest, res: Response) => {
  try {
    const { trackId } = req.params;
    const lyrics = db.prepare('SELECT * FROM lyrics WHERE track_id = ?').all(trackId);
    res.json(lyrics);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener letras' });
  }
};

export const uploadLyrics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { trackId } = req.params;
    const { lyrics, type } = req.body;
    const result = db.prepare('INSERT INTO lyrics (track_id, lyrics, type) VALUES (?, ?, ?)').run(trackId, lyrics, type || 'plain');
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir letras' });
  }
};

export const deleteLyrics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.params;
    db.prepare('DELETE FROM lyrics WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar letras' });
  }
};
