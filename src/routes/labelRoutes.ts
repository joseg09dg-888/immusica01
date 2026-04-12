import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import db from '../database';

const router = express.Router();
router.use(authenticate);

// GET /api/labels/my — get current user's label
router.get('/my', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const label = await db.prepare(
      `SELECT * FROM labels WHERE owner_id = ? LIMIT 1`
    ).get(req.user.id);
    if (!label) return res.status(404).json({ error: 'No tienes un sello aún' });
    res.json(label);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sello' });
  }
});

// POST /api/labels — create label
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre del sello requerido' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const result = await db.prepare(
      `INSERT INTO labels (owner_id, name, slug) VALUES (?, ?, ?) RETURNING *`
    ).get(req.user.id, name.trim(), slug);
    res.status(201).json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear sello' });
  }
});

// GET /api/labels/:id/artists — list artists in label
router.get('/:id/artists', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const labelId = parseInt(req.params.id as string);
    const label = await db.prepare(`SELECT * FROM labels WHERE id = ? AND owner_id = ?`).get(labelId, req.user.id);
    if (!label) return res.status(404).json({ error: 'Sello no encontrado' });
    const artists = await db.prepare(`
      SELECT la.*, u.name, u.email
      FROM label_artists la
      JOIN users u ON la.artist_id = u.id
      WHERE la.label_id = ?
      ORDER BY la.created_at DESC
    `).all(labelId);
    res.json(artists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener artistas' });
  }
});

// POST /api/labels/:id/artists — add artist to label
router.post('/:id/artists', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const labelId = parseInt(req.params.id as string);
    const { email, royalty_split = 85 } = req.body;
    if (!email) return res.status(400).json({ error: 'Email del artista requerido' });
    const label = await db.prepare(`SELECT * FROM labels WHERE id = ? AND owner_id = ?`).get(labelId, req.user.id);
    if (!label) return res.status(404).json({ error: 'Sello no encontrado' });
    const artist = await db.prepare(`SELECT id, name, email FROM users WHERE email = ?`).get(email) as { id: number; name: string; email: string } | undefined;
    if (!artist) return res.status(404).json({ error: 'Artista no encontrado con ese email' });
    await db.prepare(
      `INSERT INTO label_artists (label_id, artist_id, royalty_split) VALUES (?, ?, ?)
       ON CONFLICT DO NOTHING`
    ).run(labelId, artist.id, royalty_split);
    res.status(201).json({ mensaje: 'Artista agregado al sello', artist });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar artista' });
  }
});

// GET /api/labels/:id/stats — consolidated stats for all artists
router.get('/:id/stats', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const labelId = parseInt(req.params.id as string);
    const label = await db.prepare(`SELECT * FROM labels WHERE id = ? AND owner_id = ?`).get(labelId, req.user.id);
    if (!label) return res.status(404).json({ error: 'Sello no encontrado' });
    const artistRows = await db.prepare(
      `SELECT artist_id FROM label_artists WHERE label_id = ? AND status = 'active'`
    ).all(labelId) as { artist_id: number }[];
    const artistIds = artistRows.map(r => r.artist_id);
    let totalStreams = 0, totalRevenue = 0, totalTracks = 0;
    if (artistIds.length > 0) {
      const placeholders = artistIds.map(() => '?').join(',');
      const trackRows = await db.prepare(
        `SELECT t.id FROM tracks t JOIN artists a ON t.artist_id = a.id WHERE a.user_id IN (${placeholders})`
      ).all(...artistIds) as { id: number }[];
      totalTracks = trackRows.length;
      if (trackRows.length > 0) {
        const trackIds = trackRows.map(r => r.id);
        const ph2 = trackIds.map(() => '?').join(',');
        const royaltyRows = await db.prepare(
          `SELECT SUM(cantidad) as total_revenue, SUM(streams) as total_streams
           FROM royalties r LEFT JOIN daily_stats ds ON r.track_id = ds.track_id
           WHERE r.track_id IN (${ph2})`
        ).get(...trackIds) as { total_revenue: number | null; total_streams: number | null } | undefined;
        totalRevenue = royaltyRows?.total_revenue ?? 0;
        totalStreams = royaltyRows?.total_streams ?? 0;
      }
    }
    res.json({ total_artists: artistIds.length, total_tracks: totalTracks, total_streams: totalStreams, total_revenue: totalRevenue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// PUT /api/labels/:id/artist/:artistId/split — update royalty split
router.put('/:id/artist/:artistId/split', async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const labelId = parseInt(req.params.id as string);
    const artistId = parseInt(req.params.artistId as string);
    const { royalty_split } = req.body;
    if (royalty_split == null || royalty_split < 0 || royalty_split > 100) {
      return res.status(400).json({ error: 'royalty_split debe ser entre 0 y 100' });
    }
    const label = await db.prepare(`SELECT id FROM labels WHERE id = ? AND owner_id = ?`).get(labelId, req.user.id);
    if (!label) return res.status(404).json({ error: 'Sello no encontrado' });
    await db.prepare(
      `UPDATE label_artists SET royalty_split = ? WHERE label_id = ? AND artist_id = ?`
    ).run(royalty_split, labelId, artistId);
    res.json({ mensaje: 'Split actualizado', royalty_split });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar split' });
  }
});

export default router;
