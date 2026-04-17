import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSummary,
  uploadRoyalties,
  getAllRoyalties,
  getWithholdingsByTrack,
  getMyWithholdings,
  releaseWithholding
} from '../controllers/royaltyController';
import { AuthRequest } from '../middleware/auth';
import db from '../database';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get('/summary', getSummary);
router.post('/upload', uploadRoyalties);
router.get('/', authorize('admin'), getAllRoyalties);

// Monthly revenue breakdown
router.get('/monthly', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const userArtists = await db.prepare(
      'SELECT artist_id FROM user_artists WHERE user_id = ? AND role = ?'
    ).all(req.user.id, 'owner') as { artist_id: number }[];
    if (userArtists.length === 0) return res.json([]);
    const artistId = userArtists[0].artist_id;
    const rows = await db.prepare(`
      SELECT SUBSTRING(r.fecha, 1, 7) as month,
             COALESCE(SUM(r.cantidad), 0) as revenue,
             0 as streams
      FROM royalties r
      JOIN tracks t ON r.track_id = t.id
      WHERE t.artist_id = ?
      GROUP BY SUBSTRING(r.fecha, 1, 7)
      ORDER BY month DESC
      LIMIT 12
    `).all(artistId) as any[];
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener regalías mensuales' });
  }
});

// Rutas para retenciones
router.get('/withholdings/track/:trackId', getWithholdingsByTrack);
router.get('/withholdings/my', getMyWithholdings);
router.put('/withholdings/:withholdingId/release', releaseWithholding);

export default router;