import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';

export const purchaseLegacy = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId, amount } = req.body;
    if (!trackId) return res.status(400).json({ error: 'trackId es obligatorio' });

    const trackIdNum = parseInt(trackId, 10);
    if (isNaN(trackIdNum)) return res.status(400).json({ error: 'ID de track inválido' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = await TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    if (track.is_legacy) return res.status(400).json({ error: 'Este track ya tiene Leave a Legacy activo' });

    const now = new Date().toISOString();

    const purchaseResult = await db.prepare(`
      INSERT INTO legacy_purchases (user_id, artist_id, track_id, amount, purchase_date, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run(req.user.id, artistId, trackIdNum, amount || 49.99, now);
    const purchaseId = purchaseResult.lastInsertRowid;

    await db.prepare(`UPDATE tracks SET is_legacy = 1, legacy_purchased_at = ? WHERE id = ?`).run(now, trackIdNum);

    res.status(201).json({
      purchaseId,
      message: 'Leave a Legacy adquirido correctamente. Este track permanecerá publicado aunque canceles tu suscripción.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la compra' });
  }
};

export const purchaseLegacyForAll = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { amount } = req.body;

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const now = new Date().toISOString();

    const purchaseResult = await db.prepare(`
      INSERT INTO legacy_purchases (user_id, artist_id, track_id, amount, purchase_date, status)
      VALUES (?, ?, NULL, ?, ?, 'active')
    `).run(req.user.id, artistId, amount || 199.99, now);
    const purchaseId = purchaseResult.lastInsertRowid;

    await db.prepare(`UPDATE tracks SET is_legacy = 1, legacy_purchased_at = ? WHERE artist_id = ?`).run(now, artistId);

    res.status(201).json({ purchaseId, message: 'Leave a Legacy adquirido para todo tu catálogo.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la compra' });
  }
};

export const getLegacyStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const trackIdStr = Array.isArray(req.params.trackId) ? req.params.trackId[0] : req.params.trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) return res.status(400).json({ error: 'ID de track inválido' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = await TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) return res.status(404).json({ error: 'Track no encontrado' });

    res.json({
      trackId: trackIdNum,
      is_legacy: track.is_legacy || false,
      legacy_purchased_at: track.legacy_purchased_at || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
};

export const listLegacyPurchases = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;

    const purchases = await db.prepare(`
      SELECT lp.*, t.title as track_title
      FROM legacy_purchases lp
      LEFT JOIN tracks t ON lp.track_id = t.id
      WHERE lp.artist_id = ?
      ORDER BY lp.purchase_date DESC
    `).all(artistId);

    res.json(purchases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar compras' });
  }
};
