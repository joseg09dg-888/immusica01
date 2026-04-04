import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';

// Interfaces para tipar los resultados de las consultas
interface TotalStreamsRow {
  totalStreams: number | null;
  totalIngresos: number | null;
}

interface CertificationRow {
  id: number;
  artist_id: number;
  certification_type: string;
  threshold: number;
  achieved_at: string;
  created_at: string;
}

// Umbrales de certificación RIAA (en unidades equivalentes a streams)
const RIAA_THRESHOLDS = {
  silver: 100000,
  gold: 500000,
  platinum: 1000000,
  multi_platinum: 2000000,
  diamond: 10000000
};

// ============================================
// Obtener el estado de certificación de un artista
// ============================================
export const getCertificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    // Obtener el artista principal del usuario (o el que se pase por query)
    let artistId: number;
    const queryArtistId = req.query.artistId;

    if (queryArtistId !== undefined) {
      // Convertir queryArtistId a string de manera segura
      let artistIdStr: string | undefined;
      if (typeof queryArtistId === 'string') {
        artistIdStr = queryArtistId;
      } else if (Array.isArray(queryArtistId) && queryArtistId.length > 0 && typeof queryArtistId[0] === 'string') {
        artistIdStr = queryArtistId[0];
      } else {
        return res.status(400).json({ error: 'ID de artista inválido' });
      }

      artistId = parseInt(artistIdStr, 10);
      if (isNaN(artistId)) {
        return res.status(400).json({ error: 'ID de artista inválido' });
      }

      // Verificar que el usuario tiene acceso a ese artista
      const artists = await ArtistModel.getArtistsByUser(req.user.id);
      if (!artists.some(a => a.id === artistId)) {
        return res.status(403).json({ error: 'No tienes acceso a este artista' });
      }
    } else {
      const artists = await ArtistModel.getArtistsByUser(req.user.id);
      if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
      artistId = artists[0].id;
    }

    // Calcular total de streams del artista (desde daily_stats)
    const totalStreamsRow = await db.prepare(`
      SELECT SUM(streams) as totalStreams, SUM(ingresos) as totalIngresos
      FROM daily_stats ds
      JOIN tracks t ON ds.track_id = t.id
      WHERE t.artist_id = ?
    `).get(artistId) as TotalStreamsRow | undefined;

    const totalStreams = totalStreamsRow?.totalStreams || 0;
    const totalIngresos = totalStreamsRow?.totalIngresos || 0;

    // Determinar las certificaciones alcanzadas
    const certifications: { type: string; achieved: boolean; threshold: number; achievedAt?: string }[] = [];
    
    for (const [type, threshold] of Object.entries(RIAA_THRESHOLDS)) {
      if (totalStreams >= threshold) {
        // Verificar si ya está registrada en la base de datos
        const existing = await db.prepare(`
          SELECT * FROM riaa_certifications
          WHERE artist_id = ? AND certification_type = ?
        `).get(artistId, type) as CertificationRow | undefined;

        if (!existing) {
          // Registrar la certificación
          await db.prepare(`
            INSERT INTO riaa_certifications (artist_id, certification_type, threshold, achieved_at)
            VALUES (?, ?, ?, ?)
          `).run(artistId, type, threshold, new Date().toISOString());
        }

        certifications.push({
          type,
          achieved: true,
          threshold,
          achievedAt: existing?.achieved_at || new Date().toISOString()
        });
      } else {
        certifications.push({ type, achieved: false, threshold });
      }
    }

    res.json({
      artistId,
      totalStreams,
      totalIngresos,
      certifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estado de certificación' });
  }
};

// ============================================
// Obtener certificaciones históricas de un artista
// ============================================
export const getCertificationHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { artistId } = req.params;
    // Manejar si artistId es un array (poco probable, pero por seguridad)
    const artistIdStr = Array.isArray(artistId) ? artistId[0] : artistId;
    const artistIdNum = parseInt(artistIdStr, 10);
    if (isNaN(artistIdNum)) {
      return res.status(400).json({ error: 'ID de artista inválido' });
    }

    // Verificar acceso
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (!artists.some(a => a.id === artistIdNum)) {
      return res.status(403).json({ error: 'No tienes acceso a este artista' });
    }

    const certifications = await db.prepare(`
      SELECT * FROM riaa_certifications
      WHERE artist_id = ?
      ORDER BY achieved_at DESC
    `).all(artistIdNum) as CertificationRow[];

    res.json(certifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener historial de certificaciones' });
  }
};