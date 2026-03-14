import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';

// ============================================
// COMPRAR LEAVE A LEGACY PARA UN TRACK
// ============================================
export const purchaseLegacy = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId, amount } = req.body;
    if (!trackId) {
      return res.status(400).json({ error: 'trackId es obligatorio' });
    }

    const trackIdNum = parseInt(trackId, 10);
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

    // Verificar si ya es legacy
    if (track.is_legacy) {
      return res.status(400).json({ error: 'Este track ya tiene Leave a Legacy activo' });
    }

    const now = new Date().toISOString();

    // Registrar la compra
    const insertPurchase = db.prepare(`
      INSERT INTO legacy_purchases (user_id, artist_id, track_id, amount, purchase_date, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);
    const purchaseResult = insertPurchase.run(req.user.id, artistId, trackIdNum, amount || 49.99, now);
    const purchaseId = purchaseResult.lastInsertRowid;

    // Marcar el track como legacy
    db.prepare(`
      UPDATE tracks SET is_legacy = 1, legacy_purchased_at = ? WHERE id = ?
    `).run(now, trackIdNum);

    res.status(201).json({
      purchaseId,
      message: 'Leave a Legacy adquirido correctamente. Este track permanecerá publicado aunque canceles tu suscripción.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la compra' });
  }
};

// ============================================
// COMPRAR LEAVE A LEGACY PARA TODO EL CATÁLOGO DEL ARTISTA
// ============================================
export const purchaseLegacyForAll = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { amount } = req.body;

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const now = new Date().toISOString();

    // Registrar compra general (sin track específico)
    const insertPurchase = db.prepare(`
      INSERT INTO legacy_purchases (user_id, artist_id, track_id, amount, purchase_date, status)
      VALUES (?, ?, NULL, ?, ?, 'active')
    `);
    const purchaseResult = insertPurchase.run(req.user.id, artistId, amount || 199.99, now);
    const purchaseId = purchaseResult.lastInsertRowid;

    // Marcar todos los tracks del artista como legacy
    db.prepare(`
      UPDATE tracks SET is_legacy = 1, legacy_purchased_at = ? WHERE artist_id = ?
    `).run(now, artistId);

    res.status(201).json({
      purchaseId,
      message: 'Leave a Legacy adquirido para todo tu catálogo.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la compra' });
  }
};

// ============================================
// OBTENER ESTADO DE LEGACY DE UN TRACK
// ============================================
export const getLegacyStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
      return res.status(400).json({ error: 'ID de track inválido' });
    }

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado' });
    }

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

// ============================================
// LISTAR COMPRAS DE LEGACY DEL ARTISTA
// ============================================
export const listLegacyPurchases = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;

    const purchases = db.prepare(`
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