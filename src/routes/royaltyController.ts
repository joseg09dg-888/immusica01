import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import * as RoyaltyModel from '../models/Royalty';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import db from '../database';

const upload = multer({ dest: 'uploads/' });

const processSplitsForRoyalty = (trackId: number, cantidad: number) => {
  try {
    const splits = db.prepare('SELECT * FROM splits WHERE track_id = ? AND status = "accepted"').all(trackId) as any[];
    if (splits.length === 0) return;

    const totalSplits = splits.reduce((sum: number, s: any) => sum + s.percentage, 0);
    if (totalSplits > 0) {
      const retenido = (cantidad * totalSplits) / 100;
      db.prepare(`
        INSERT INTO royalty_withholdings (track_id, cantidad, estado)
        VALUES (?, ?, 'retenido')
      `).run(trackId, retenido);
      console.log(`Retenido ${retenido} para track ${trackId} por splits`);
    }
  } catch (error) {
    console.error('Error procesando splits:', error);
  }
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    let artistId: number | undefined;
    if (req.user.role !== 'admin') {
      const artists = ArtistModel.getArtistsByUser(req.user.id);
      if (artists.length === 0) return res.json({ total: 0, byPlatform: {}, byMonth: {} });
      artistId = artists[0].id;
    }
    
    const summary = RoyaltyModel.getSummary(artistId);
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

export const uploadRoyalties = [
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

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
              trackId = parseInt(row.track_id);
            } else if (row.track_title) {
              const track = db.prepare('SELECT id FROM tracks WHERE title = ?').get(row.track_title) as { id: number } | undefined;
              if (track) trackId = track.id;
            }

            if (!trackId) {
              console.warn('No se pudo determinar el track para la fila:', row);
              continue;
            }

            RoyaltyModel.createRoyalty({
              fecha: row.fecha,
              plataforma: row.plataforma,
              tipo: row.tipo || null,
              cantidad: parseFloat(row.cantidad),
              track_id: trackId,
              concepto: row.concepto || null,
              estado: row.estado || 'proyectado'
            });

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

export const getAllRoyalties = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Prohibido' });
  const royalties = RoyaltyModel.getAllRoyalties();
  res.json(royalties);
};

// ========== ENDPOINTS PARA RETENCIONES ==========

export const getWithholdingsByTrack = (req: AuthRequest, res: Response) => {
  const { trackId } = req.params;
  if (!trackId) return res.status(400).json({ error: 'trackId requerido' });

  try {
    const withholdings = db.prepare('SELECT * FROM royalty_withholdings WHERE track_id = ?').all(trackId);
    res.json(withholdings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener retenciones' });
  }
};

export const getMyWithholdings = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });

  try {
    const tracks = db.prepare(`
      SELECT t.id 
      FROM tracks t
      JOIN artists a ON t.artist_id = a.id
      WHERE a.user_id = ?
    `).all(req.user.id) as any[];

    const trackIds = tracks.map(t => t.id);
    if (trackIds.length === 0) return res.json([]);

    const placeholders = trackIds.map(() => '?').join(',');
    const withholdings = db.prepare(`SELECT * FROM royalty_withholdings WHERE track_id IN (${placeholders})`).all(...trackIds);
    res.json(withholdings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener retenciones' });
  }
};

export const releaseWithholding = (req: AuthRequest, res: Response) => {
  const { withholdingId } = req.params;

  try {
    const withholding = db.prepare('SELECT * FROM royalty_withholdings WHERE id = ?').get(withholdingId);
    if (!withholding) return res.status(404).json({ error: 'Retención no encontrada' });

    db.prepare('UPDATE royalty_withholdings SET estado = "liberado", released_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      withholdingId
    );

    res.json({ message: 'Retención liberada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al liberar retención' });
  }
};