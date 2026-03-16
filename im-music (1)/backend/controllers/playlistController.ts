import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export const getPlaylists = async (req: AuthRequest, res: Response) => {
  try {
    const { genre, mood } = req.query;
    let query = 'SELECT * FROM playlists WHERE 1=1';
    const params: any[] = [];
    if (genre) {
      query += ' AND genre = ?';
      params.push(genre);
    }
    if (mood) {
      query += ' AND moods LIKE ?';
      params.push(`%${mood}%`);
    }
    const playlists = db.prepare(query).all(...params);
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener playlists' });
  }
};

export const createPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { name, url, genre, moods, contact_email } = req.body;
    const result = db.prepare('INSERT INTO playlists (name, url, genre, moods, contact_email) VALUES (?, ?, ?, ?, ?)').run(name, url, genre, JSON.stringify(moods), contact_email);
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear playlist' });
  }
};

export const updatePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.params;
    const { name, url, genre, moods, contact_email } = req.body;
    db.prepare('UPDATE playlists SET name = ?, url = ?, genre = ?, moods = ?, contact_email = ? WHERE id = ?').run(name, url, genre, JSON.stringify(moods), contact_email, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar playlist' });
  }
};

export const deletePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.params;
    db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar playlist' });
  }
};

export const getMoods = async (req: AuthRequest, res: Response) => {
  res.json(['Chill', 'Energetic', 'Dark', 'Happy', 'Sad', 'Romantic', 'Aggressive']);
};
