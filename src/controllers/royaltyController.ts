import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import db from '../database';

const upload = multer({ dest: 'uploads/' });

// Función auxiliar para obtener un string seguro de req.params
const getParamAsString = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

// ============================================
// FUNCIÓN AUXILIAR: Procesar splits y retenciones
// ============================================
const processSplitsForRoyalty = async (trackId: number, cantidad: number) => {
  try {
    const splits = await db.prepare(`
      SELECT * FROM splits WHERE track_id = ? AND status = "accepted"
    `).all(trackId) as any[];

    if (splits.length === 0) return;

    const totalSplits = splits.reduce((sum: number, s: any) => sum + s.percentage, 0);
    if (totalSplits > 0) {
      const retenido = (cantidad * totalSplits) / 100;
      await db.prepare(`
        INSERT INTO royalty_withholdings (track_id, cantidad, estado)
        VALUES (?, ?, 'retenido')
      `).run(trackId, retenido);
      console.log(`Retenido ${retenido} para track ${trackId} por splits`);
    }
  } catch (error) {
    console.error('Error procesando splits:', error);
  }
};

// ============================================
// RESUMEN DE REGALÍAS
// ============================================
export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    // Obtener el artist_id del usuario actual
    const userArtists = await db.prepare(`
      SELECT artist_id FROM user_artists WHERE user_id = ? AND role = 'owner'
    `).all(req.user.id) as { artist_id: number }[];

    if (userArtists.length === 0) {
      return res.json({ total: 0, byPlatform: {}, byMonth: {} });
    }

    const artistId = userArtists[0].artist_id;

    const royalties = await db.prepare(`
      SELECT * FROM royalties WHERE track_id IN (SELECT id FROM tracks WHERE artist_id = ?)
    `).all(artistId) as any[];

    const total = royalties.reduce((acc, r) => acc + r.cantidad, 0);
    const byPlatform: any = {};
    const byMonth: any = {};

    royalties.forEach(r => {
      byPlatform[r.plataforma] = (byPlatform[r.plataforma] || 0) + r.cantidad;
      const month = r.fecha.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + r.cantidad;
    });

    res.json({ total, byPlatform, byMonth });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

// ============================================
// SUBIR CSV DE REGALÍAS
// ============================================
export const uploadRoyalties = [
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      const userArtists = await db.prepare(`
        SELECT artist_id FROM user_artists WHERE user_id = ? AND role = 'owner'
      `).all(req.user.id) as { artist_id: number }[];

      if (userArtists.length === 0) {
        return res.status(404).json({ error: 'El usuario no tiene un artista asociado' });
      }
      const artistId = userArtists[0].artist_id;

      const results: any[] = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          for (const row of results) {
            if (!row.fecha || !row.plataforma || !row.cantidad) {
              console.warn('Fila incompleta, se omite:', row);
              continue;
            }

            let trackId: number | null = null;

            if (row.track_id) {
              trackId = parseInt(row.track_id, 10);
            } else if (row.track_title) {
              const track = await db.prepare(`
                SELECT id FROM tracks WHERE artist_id = ? AND title = ?
              `).get(artistId, row.track_title) as { id: number } | undefined;
              if (track) {
                trackId = track.id;
              }
            }

            if (!trackId) {
              console.warn('No se pudo determinar el track para la fila:', row);
              continue;
            }

            await db.prepare(`
              INSERT INTO royalties (track_id, fecha, plataforma, cantidad, estado)
              VALUES (?, ?, ?, ?, ?)
            `).run(trackId, row.fecha, row.plataforma, parseFloat(row.cantidad), row.estado || 'proyectado');

            processSplitsForRoyalty(trackId, parseFloat(row.cantidad));
          }

          res.json({ message: 'Archivo procesado correctamente', filas: results.length });
        })
        .on('error', (err) => {
          console.error(err);
          res.status(500).json({ error: 'Error al leer el archivo CSV' });
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al procesar el archivo' });
    }
  }
];

// ============================================
// OBTENER TODAS LAS REGALÍAS (SOLO ADMIN)
// ============================================
export const getAllRoyalties = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Prohibido' });
  const royalties = await db.prepare('SELECT * FROM royalties').all();
  res.json(royalties);
};

// ============================================
// RETENCIONES
// ============================================
export const getWithholdingsByTrack = async (req: AuthRequest, res: Response) => {
  const trackIdParam = getParamAsString(req.params.trackId);
  const trackId = parseInt(trackIdParam, 10);
  if (isNaN(trackId)) return res.status(400).json({ error: 'ID de track inválido' });

  try {
    const withholdings = await db.prepare('SELECT * FROM royalty_withholdings WHERE track_id = ?').all(trackId);
    res.json(withholdings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener retenciones' });
  }
};

export const getMyWithholdings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const userArtists = await db.prepare(`
      SELECT artist_id FROM user_artists WHERE user_id = ? AND role = 'owner'
    `).all(req.user.id) as { artist_id: number }[];

    if (userArtists.length === 0) return res.json([]);
    const artistId = userArtists[0].artist_id;

    const tracks = await db.prepare(`
      SELECT id FROM tracks WHERE artist_id = ?
    `).all(artistId) as { id: number }[];

    const trackIds = tracks.map(t => t.id);
    if (trackIds.length === 0) return res.json([]);

    const placeholders = trackIds.map(() => '?').join(',');
    const withholdings = await db.prepare(`
      SELECT * FROM royalty_withholdings WHERE track_id IN (${placeholders})
    `).all(...trackIds);

    res.json(withholdings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener retenciones' });
  }
};

export const releaseWithholding = async (req: AuthRequest, res: Response) => {
  const idParam = getParamAsString(req.params.withholdingId);
  const id = parseInt(idParam, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const withholding = await db.prepare('SELECT * FROM royalty_withholdings WHERE id = ?').get(id);
    if (!withholding) return res.status(404).json({ error: 'Retención no encontrada' });

    await db.prepare(`
      UPDATE royalty_withholdings SET estado = "liberado", released_at = ? WHERE id = ?
    `).run(new Date().toISOString(), id);

    res.json({ message: 'Retención liberada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al liberar retención' });
  }
};