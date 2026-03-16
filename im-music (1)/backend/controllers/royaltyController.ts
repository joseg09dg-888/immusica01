import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import * as RoyaltyModel from '../models/Royalty';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import db from '../config/database';

const upload = multer({ dest: 'uploads/' });

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

      let records: any[] = [];

      if (req.file) {
        const fs = await import('fs');
        const fileContent = fs.readFileSync(req.file.path, 'utf-8');
        records = parse(fileContent, { columns: true, skip_empty_lines: true });
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } else if (req.body.csv) {
        records = parse(req.body.csv, { columns: true, skip_empty_lines: true });
      } else {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo o datos CSV' });
      }

      const artists = ArtistModel.getArtistsByUser(req.user.id);
      const artistId = artists.length > 0 ? artists[0].id : null;

      for (const row of records) {
        if (!row.fecha || !row.plataforma || !row.cantidad) {
          console.warn('Fila incompleta, se omite:', row);
          continue;
        }

        let trackId = null;
        if (row.track_id) {
          trackId = parseInt(row.track_id);
        } else if (row.track_title) {
          const tracks = TrackModel.getAllTracks().filter((t: any) => t.title === row.track_title);
          if (tracks.length > 0) trackId = tracks[0].id;
        }

        RoyaltyModel.createRoyalty({
          artist_id: artistId,
          fecha: row.fecha,
          plataforma: row.plataforma,
          tipo: row.tipo || null,
          cantidad: parseFloat(row.cantidad),
          track_id: trackId,
          concepto: row.concepto || null,
          estado: row.estado || 'proyectado'
        });

        // Trigger withholding if track has splits
        if (trackId) {
          processSplitsForRoyalty(trackId, parseFloat(row.cantidad));
        }
      }

      res.json({ message: 'Datos procesados correctamente', filas: records.length });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Error al procesar los datos: ' + error.message });
    }
  }
];

export const getAllRoyalties = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });

  if (req.user.role === 'admin') {
    const royalties = RoyaltyModel.getAllRoyalties();
    return res.json(royalties);
  }

  const artists = ArtistModel.getArtistsByUser(req.user.id);
  if (artists.length === 0) return res.json([]);
  
  const royalties = RoyaltyModel.getRoyaltiesByArtist(artists[0].id);
  res.json(royalties);
};

export const processRoyalty = async (req: AuthRequest, res: Response) => {
  const { track_id, cantidad, plataforma, fecha } = req.body;
  try {
    const track = db.prepare('SELECT artist_id FROM tracks WHERE id = ?').get(track_id) as any;
    if (!track) return res.status(404).json({ error: 'Track not found' });

    RoyaltyModel.createRoyalty({
      artist_id: track.artist_id,
      fecha,
      plataforma,
      cantidad,
      track_id,
      estado: 'pagado',
      tipo: 'manual',
      concepto: 'Procesado manualmente'
    });

    processSplitsForRoyalty(track_id, cantidad);
    res.json({ message: 'Royalty processed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const processSplitsForRoyalty = (trackId: number, amount: number) => {
  const splits = db.prepare('SELECT * FROM splits WHERE track_id = ? AND status = "accepted"').all(trackId) as any[];
  for (const split of splits) {
    const withholdAmount = (amount * split.percentage) / 100;
    db.prepare(`
      INSERT INTO royalty_withholdings (track_id, split_id, cantidad)
      VALUES (?, ?, ?)
    `).run(trackId, split.id, withholdAmount);
  }
};

export const getWithholdingsByTrack = (req: AuthRequest, res: Response) => {
  const { trackId } = req.params;
  try {
    const withholdings = db.prepare('SELECT * FROM royalty_withholdings WHERE track_id = ?').all(trackId);
    res.json(withholdings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyWithholdings = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });
  try {
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;

    const withholdings = db.prepare(`
      SELECT rw.*, t.title as track_title, s.artist_name as collaborator_name
      FROM royalty_withholdings rw
      JOIN tracks t ON rw.track_id = t.id
      LEFT JOIN splits s ON rw.split_id = s.id
      WHERE t.artist_id = ?
    `).all(artistId);
    res.json(withholdings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const releaseWithholding = (req: AuthRequest, res: Response) => {
  const { withholdingId } = req.params;
  try {
    db.prepare('UPDATE royalty_withholdings SET estado = "released", released_at = CURRENT_TIMESTAMP WHERE id = ?').run(withholdingId);
    res.json({ message: 'Withholding released' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
