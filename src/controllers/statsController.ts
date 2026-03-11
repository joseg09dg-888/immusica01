import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import db from '../database';

const upload = multer({ dest: 'uploads/' });

// Definir interfaces para los resultados de las consultas
interface TrackRow {
  id: number;
  title: string;
  release_date?: string;
}

interface StatsRow {
  id: number;
  track_id: number;
  fecha: string;
  plataforma: string;
  streams: number;
  ingresos: number;
  created_at: string;
  updated_at: string;
  title?: string; // para join con tracks
}

interface TotalRow {
  totalStreams: number | null;
  totalIngresos: number | null;
}

interface PlatformRow {
  plataforma: string;
  streams: number;
  ingresos: number;
}

interface MonthRow {
  mes: string;
  streams: number;
  ingresos: number;
}

// ============================================
// SUBIR ARCHIVO CSV DE ESTADÍSTICAS DIARIAS
// ============================================
export const uploadDailyStats = [
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      // Obtener el artist_id del usuario autenticado
      const artists = ArtistModel.getArtistsByUser(req.user.id);
      if (artists.length === 0) {
        return res.status(404).json({ error: 'Artista no encontrado' });
      }
      const artistId = artists[0].id;

      const results: any[] = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          // Eliminar archivo temporal
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          let filasProcesadas = 0;
          const errors: string[] = [];

          for (const row of results) {
            // Validar campos obligatorios
            if (!row.track_id || !row.fecha || !row.plataforma || (!row.streams && !row.ingresos)) {
              errors.push(`Fila incompleta: ${JSON.stringify(row)}`);
              continue;
            }

            // Verificar que el track pertenezca al artista
            const track = db.prepare('SELECT id FROM tracks WHERE id = ? AND artist_id = ?').get(row.track_id, artistId) as { id: number } | undefined;
            if (!track) {
              errors.push(`Track ID ${row.track_id} no pertenece al artista`);
              continue;
            }

            // Insertar o reemplazar estadística
            const streams = parseInt(row.streams) || 0;
            const ingresos = parseFloat(row.ingresos) || 0;

            db.prepare(`
              INSERT INTO daily_stats (track_id, fecha, plataforma, streams, ingresos)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(track_id, fecha, plataforma) 
              DO UPDATE SET 
                streams = excluded.streams,
                ingresos = excluded.ingresos,
                updated_at = CURRENT_TIMESTAMP
            `).run(row.track_id, row.fecha, row.plataforma, streams, ingresos);

            filasProcesadas++;
          }

          res.json({
            message: 'Archivo procesado',
            filasProcesadas,
            errores: errors.length > 0 ? errors : undefined
          });
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
// OBTENER ESTADÍSTICAS DE UN TRACK ESPECÍFICO
// ============================================
export const getTrackStats = (req: AuthRequest, res: Response) => {
  const { trackId } = req.params;

  try {
    const stats = db.prepare(`
      SELECT * FROM daily_stats 
      WHERE track_id = ? 
      ORDER BY fecha DESC
    `).all(trackId) as StatsRow[];

    // Calcular totales
    const totalStreams = stats.reduce((sum, row) => sum + row.streams, 0);
    const totalIngresos = stats.reduce((sum, row) => sum + row.ingresos, 0);

    res.json({
      trackId,
      totalStreams,
      totalIngresos,
      stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// ============================================
// OBTENER RESUMEN GENERAL DEL ARTISTA
// ============================================
export const getArtistSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    // Obtener artist_id del usuario
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }
    const artistId = artists[0].id;

    // Obtener todos los tracks del artista
    const tracks = db.prepare('SELECT id, title FROM tracks WHERE artist_id = ?').all(artistId) as TrackRow[];
    const trackIds = tracks.map(t => t.id);

    if (trackIds.length === 0) {
      return res.json({
        totalStreams: 0,
        totalIngresos: 0,
        porPlataforma: [],
        porMes: [],
        recentStats: [],
        tracks: []
      });
    }

    // Construir placeholders para IN query
    const placeholders = trackIds.map(() => '?').join(',');
    
    // Estadísticas totales
    const totalsRow = db.prepare(`
      SELECT 
        SUM(streams) as totalStreams,
        SUM(ingresos) as totalIngresos
      FROM daily_stats 
      WHERE track_id IN (${placeholders})
    `).get(...trackIds) as TotalRow | undefined;

    const totalStreams = totalsRow?.totalStreams || 0;
    const totalIngresos = totalsRow?.totalIngresos || 0;

    // Agrupar por plataforma
    const byPlatform = db.prepare(`
      SELECT 
        plataforma,
        SUM(streams) as streams,
        SUM(ingresos) as ingresos
      FROM daily_stats 
      WHERE track_id IN (${placeholders})
      GROUP BY plataforma
    `).all(...trackIds) as PlatformRow[];

    // Agrupar por mes (YYYY-MM)
    const byMonth = db.prepare(`
      SELECT 
        substr(fecha, 1, 7) as mes,
        SUM(streams) as streams,
        SUM(ingresos) as ingresos
      FROM daily_stats 
      WHERE track_id IN (${placeholders})
      GROUP BY substr(fecha, 1, 7)
      ORDER BY mes DESC
    `).all(...trackIds) as MonthRow[];

    // Últimas 30 estadísticas
    const recentStats = db.prepare(`
      SELECT ds.*, t.title
      FROM daily_stats ds
      JOIN tracks t ON ds.track_id = t.id
      WHERE ds.track_id IN (${placeholders})
      ORDER BY ds.fecha DESC
      LIMIT 30
    `).all(...trackIds) as (StatsRow & { title: string })[];

    res.json({
      totalStreams,
      totalIngresos,
      porPlataforma: byPlatform,
      porMes: byMonth,
      recentStats,
      tracks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

// ============================================
// OBTENER LISTA DE TRACKS DEL ARTISTA (para selects)
// ============================================
export const getArtistTracks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }
    const artistId = artists[0].id;

    const tracks = db.prepare(`
      SELECT id, title, release_date 
      FROM tracks 
      WHERE artist_id = ?
      ORDER BY created_at DESC
    `).all(artistId) as TrackRow[];

    res.json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tracks' });
  }
};