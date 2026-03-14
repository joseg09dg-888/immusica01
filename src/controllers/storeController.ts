import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import { STORES } from '../constants/stores';

// ============================================
// ACTIVAR DISTRIBUCIÓN AUTOMÁTICA PARA UN TRACK
// ============================================
export const activateAutoDistribute = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;
    // Manejar si trackId es un array (por seguridad)
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
      return res.status(400).json({ error: 'ID de track inválido' });
    }

    // Verificar propiedad del track
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    // Activar distribución automática (marcar en la tabla tracks)
    db.prepare('UPDATE tracks SET auto_distribute = 1 WHERE id = ?').run(trackIdNum);

    res.json({ message: 'Distribución automática activada para este track' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al activar distribución' });
  }
};

// ============================================
// DESACTIVAR DISTRIBUCIÓN AUTOMÁTICA
// ============================================
export const deactivateAutoDistribute = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
      return res.status(400).json({ error: 'ID de track inválido' });
    }

    // Verificar propiedad
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    db.prepare('UPDATE tracks SET auto_distribute = 0 WHERE id = ?').run(trackIdNum);

    res.json({ message: 'Distribución automática desactivada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desactivar distribución' });
  }
};

// ============================================
// LISTAR DISTRIBUCIONES DE UN TRACK
// ============================================
export const getDistributions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
      return res.status(400).json({ error: 'ID de track inválido' });
    }

    // Verificar propiedad
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    const distributions = db.prepare(`
      SELECT * FROM store_distributions
      WHERE track_id = ?
      ORDER BY created_at DESC
    `).all(trackIdNum);

    res.json(distributions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener distribuciones' });
  }
};

// ============================================
// (OPCIONAL) FORZAR DISTRIBUCIÓN AHORA (para pruebas)
// ============================================
export const forceDistribute = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
      return res.status(400).json({ error: 'ID de track inválido' });
    }

    // Verificar propiedad
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    // Simular distribución a todas las tiendas no enviadas aún
    const existing = db.prepare('SELECT store_name FROM store_distributions WHERE track_id = ?').all(trackIdNum) as { store_name: string }[];
    const existingStores = new Set(existing.map(e => e.store_name));

    const insert = db.prepare(`
      INSERT INTO store_distributions (track_id, store_name, status, sent_at)
      VALUES (?, ?, 'sent', ?)
    `);

    const now = new Date().toISOString();
    for (const store of STORES) {
      if (!existingStores.has(store.name)) {
        insert.run(trackIdNum, store.name, now);
      }
    }

    res.json({ message: 'Distribución forzada completada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al forzar distribución' });
  }
};