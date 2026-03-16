import { Request, Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

interface StatsRow {
  track_id: string;
  fecha: string;
  plataforma: string;
  streams: string;
  ingresos: string;
}

interface SummaryTotals {
  total_streams: number;
  total_ingresos: number;
}

export const uploadStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const records = parse(fileContent, { columns: true, skip_empty_lines: true }) as StatsRow[];
    
    fs.unlinkSync(req.file.path);

    const insertStmt = db.prepare(`
      INSERT INTO daily_stats (track_id, fecha, plataforma, streams, ingresos)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(track_id, fecha, plataforma) DO UPDATE SET
        streams = excluded.streams,
        ingresos = excluded.ingresos
    `);

    const transaction = db.transaction((rows) => {
      for (const row of rows) {
        insertStmt.run(
          parseInt(row.track_id),
          row.fecha,
          row.plataforma,
          parseInt(row.streams || 0),
          parseFloat(row.ingresos || 0)
        );
      }
    });

    transaction(records);

    res.json({ message: 'Stats processed successfully', count: records.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTrackStats = async (req: Request, res: Response) => {
  const { trackId } = req.params;
  try {
    const stats = db.prepare(`
      SELECT * FROM daily_stats 
      WHERE track_id = ? 
      ORDER BY fecha DESC
    `).all(trackId);

    const totals = db.prepare(`
      SELECT SUM(streams) as total_streams, SUM(ingresos) as total_ingresos 
      FROM daily_stats 
      WHERE track_id = ?
    `).get(trackId);

    res.json({ stats, totals });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json({ total_streams: 0, total_ingresos: 0, byPlatform: [], byMonth: [], recent: [] });
    
    const artistId = artists[0].id;

    const totals = db.prepare(`
      SELECT SUM(s.streams) as total_streams, SUM(s.ingresos) as total_ingresos
      FROM daily_stats s
      JOIN tracks t ON s.track_id = t.id
      WHERE t.artist_id = ?
    `).get(artistId) as any;

    const byPlatform = db.prepare(`
      SELECT s.plataforma, SUM(s.streams) as streams, SUM(s.ingresos) as ingresos
      FROM daily_stats s
      JOIN tracks t ON s.track_id = t.id
      WHERE t.artist_id = ?
      GROUP BY s.plataforma
    `).all(artistId);

    const byMonth = db.prepare(`
      SELECT strftime('%Y-%m', s.fecha) as month, SUM(s.streams) as streams, SUM(s.ingresos) as ingresos
      FROM daily_stats s
      JOIN tracks t ON s.track_id = t.id
      WHERE t.artist_id = ?
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all(artistId);

    const recent = db.prepare(`
      SELECT s.*, t.title as track_title
      FROM daily_stats s
      JOIN tracks t ON s.track_id = t.id
      WHERE t.artist_id = ?
      ORDER BY s.fecha DESC
      LIMIT 30
    `).all(artistId);

    res.json({
      total_streams: totals.total_streams || 0,
      total_ingresos: totals.total_ingresos || 0,
      byPlatform,
      byMonth,
      recent
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getArtistTracks = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    
    const tracks = db.prepare('SELECT id, title FROM tracks WHERE artist_id = ?').all(artists[0].id);
    res.json(tracks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
