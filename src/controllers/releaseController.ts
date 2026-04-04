import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';

// Programar fecha de lanzamiento de un track
export const scheduleRelease = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;
    const { scheduled_date } = req.body;

    if (!scheduled_date) {
      return res.status(400).json({ error: 'La fecha programada es obligatoria' });
    }

    // Validar que la fecha sea futura
    const scheduled = new Date(scheduled_date);
    const now = new Date();
    if (scheduled <= now) {
      return res.status(400).json({ error: 'La fecha debe ser posterior al momento actual' });
    }

    // Obtener artist_id del usuario
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    // Verificar que el track pertenezca al artista
    const track = await db.prepare('SELECT id, status FROM tracks WHERE id = ? AND artist_id = ?').get(trackId, artistId);
    if (!track) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    // Actualizar el track
    await db.prepare(`
      UPDATE tracks 
      SET scheduled_date = ?, status = 'scheduled'
      WHERE id = ?
    `).run(scheduled_date, trackId);

    res.json({ message: 'Lanzamiento programado correctamente', scheduled_date });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al programar lanzamiento' });
  }
};

// Cancelar programación
export const cancelScheduled = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = await db.prepare('SELECT id, status FROM tracks WHERE id = ? AND artist_id = ?').get(trackId, artistId);
    if (!track) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    await db.prepare(`
      UPDATE tracks 
      SET scheduled_date = NULL, status = 'draft'
      WHERE id = ?
    `).run(trackId);

    res.json({ message: 'Programación cancelada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cancelar programación' });
  }
};

// Obtener información de programación de un track
export const getReleaseInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = db.prepare(`
      SELECT id, title, scheduled_date, release_date, published_at, status
      FROM tracks 
      WHERE id = ? AND artist_id = ?
    `).get(trackId, artistId);

    if (!track) {
      return res.status(404).json({ error: 'Track no encontrado' });
    }

    res.json(track);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener información' });
  }
};

// Listar tracks programados del artista
export const getScheduledTracks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;

    const tracks = db.prepare(`
      SELECT id, title, scheduled_date, status
      FROM tracks
      WHERE artist_id = ? AND status = 'scheduled'
      ORDER BY scheduled_date ASC
    `).all(artistId);

    res.json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tracks programados' });
  }
};