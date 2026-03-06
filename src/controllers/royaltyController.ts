import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import * as RoyaltyModel from '../models/Royalty';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

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
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      const results: any[] = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          // Eliminar archivo temporal si existe
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          for (const row of results) {
            if (!row.fecha || !row.plataforma || !row.cantidad) {
              console.warn('Fila incompleta, se omite:', row);
              continue;
            }

            let trackId = null;
            if (row.track_id) {
              trackId = parseInt(row.track_id);
            } else if (row.track_title) {
              // Tipamos explícitamente el parámetro
              const tracks = TrackModel.getAllTracks().filter((t: any) => t.title === row.track_title);
              if (tracks.length > 0) trackId = tracks[0].id;
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