import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';

// Definir tipos para los resultados
interface PlaylistRow {
  id: number;
  name: string;
  url: string;
  genre: string | null;
  mood_tags: string | null;
  contact_email: string | null;
  description: string | null;
  submitted_by: number | null;
  verified: number;
  created_at: string;
}

// Obtener todas las playlists (público, con filtros opcionales)
export const getPlaylists = async (req: Request, res: Response) => {
  try {
    const { genre, mood, limit = 50 } = req.query;
    let sql = 'SELECT * FROM playlists WHERE 1=1';
    const params: any[] = [];

    if (genre) {
      sql += ' AND genre = ?';
      params.push(genre);
    }

    if (mood) {
      // Versión simple con LIKE (busca el mood como substring en el JSON)
      sql += " AND mood_tags LIKE ?";
      params.push(`%${mood}%`);
    }

    sql += ' ORDER BY verified DESC, created_at DESC LIMIT ?';
    params.push(Number(limit));

    const playlists = await db.prepare(sql).all(...params);
    res.json(playlists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener playlists' });
  }
};

// Obtener una playlist por ID
export const getPlaylistById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const playlist = await db.prepare('SELECT * FROM playlists WHERE id = ?').get(id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }
    res.json(playlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener playlist' });
  }
};

// Crear una nueva playlist (requiere autenticación)
export const createPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { name, url, genre, mood_tags, contact_email, description } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'Nombre y URL son obligatorios' });
    }

    // Validar URL (opcional, se puede mejorar)
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'URL inválida' });
    }

    // Convertir mood_tags a JSON si viene como array
    let moodTagsJson = null;
    if (mood_tags && Array.isArray(mood_tags)) {
      moodTagsJson = JSON.stringify(mood_tags);
    } else if (typeof mood_tags === 'string') {
      // Si viene como string separado por comas, convertirlo a array
      const tags = mood_tags.split(',').map((t: string) => t.trim());
      moodTagsJson = JSON.stringify(tags);
    }

    const result = await db.prepare(`
      INSERT INTO playlists (name, url, genre, mood_tags, contact_email, description, submitted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, url, genre || null, moodTagsJson, contact_email || null, description || null, req.user.id
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Playlist agregada correctamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear playlist' });
  }
};

// Actualizar una playlist (solo el creador o admin)
export const updatePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    const { name, url, genre, mood_tags, contact_email, description, verified } = req.body;

    // Verificar que la playlist existe y pertenece al usuario (o es admin)
    const playlist = await db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as PlaylistRow | undefined;
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    // Solo el propietario o admin pueden modificar
    if (playlist.submitted_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta playlist' });
    }

    // Construir la actualización dinámicamente
    const fields: string[] = [];
    const params: any[] = [];

    if (name) { fields.push('name = ?'); params.push(name); }
    if (url) { fields.push('url = ?'); params.push(url); }
    if (genre !== undefined) { fields.push('genre = ?'); params.push(genre); }
    if (mood_tags) {
      let moodTagsJson = Array.isArray(mood_tags) ? JSON.stringify(mood_tags) : mood_tags;
      fields.push('mood_tags = ?'); params.push(moodTagsJson);
    }
    if (contact_email !== undefined) { fields.push('contact_email = ?'); params.push(contact_email); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    // Solo admin puede cambiar verified
    if (verified !== undefined && req.user.role === 'admin') {
      fields.push('verified = ?'); params.push(verified ? 1 : 0);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);
    await db.prepare(`UPDATE playlists SET ${fields.join(', ')} WHERE id = ?`).run(...params);

    res.json({ message: 'Playlist actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar playlist' });
  }
};

// Eliminar una playlist (solo el creador o admin)
export const deletePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;

    const playlist = await db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as PlaylistRow | undefined;
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }

    if (playlist.submitted_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta playlist' });
    }

    await db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
    res.json({ message: 'Playlist eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar playlist' });
  }
};

// Obtener moods disponibles (para el frontend)
export const getMoods = async (req: Request, res: Response) => {
  const moods = [
    'alegre', 'triste', 'energético', 'relajado', 'romántico', 'agresivo', 'feliz', 'melancólico'
  ];
  res.json(moods);
};