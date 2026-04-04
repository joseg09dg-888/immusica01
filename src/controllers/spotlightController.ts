import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';

// Interfaz para los resultados
interface PlaylistRow {
  id: number;
  name: string;
  url: string;
  contact_email: string | null;
  genre: string | null;
}

interface SubmissionRow {
  id: number;
  playlist_id: number;
  track_id: number;
  artist_id: number;
  message: string | null;
  status: string;
  submitted_at: string;
}

// ============================================
// ENVIAR TRACK A UNA PLAYLIST
// ============================================
export const submitToPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { playlistId, trackId, message } = req.body;
    if (!playlistId || !trackId) {
      return res.status(400).json({ error: 'playlistId y trackId son obligatorios' });
    }

    // Obtener artist_id del usuario
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id; // Asumimos que el usuario tiene al menos un artista (el principal)

    // Verificar que el track pertenece al artista
    const track = await TrackModel.getTrackById(trackId);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    // Verificar que la playlist existe y obtener su email de contacto
    const playlist = await db.prepare('SELECT id, contact_email FROM playlists WHERE id = ?').get(playlistId) as PlaylistRow | undefined;
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist no encontrada' });
    }
    if (!playlist.contact_email) {
      return res.status(400).json({ error: 'Esta playlist no tiene email de contacto' });
    }

    // Registrar el envío
    const result = await db.prepare(`
      INSERT INTO playlist_submissions (playlist_id, track_id, artist_id, message, contact_email, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(playlistId, trackId, artistId, message || null, playlist.contact_email);

    // Aquí podrías integrar un servicio de email real para notificar al curador
    // Por ahora, simulamos el envío con un console.log
    console.log(`📧 Simulando envío de email a ${playlist.contact_email}`);
    // Usamos el nombre del artista desde la variable artists (el primer artista)
    const artistName = artists[0]?.name || 'Desconocido';
    console.log(`Artista: ${artistName}, Track: ${track.title}`);
    console.log(`Mensaje: ${message || 'Sin mensaje'}`);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Track enviado a la playlist correctamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar a playlist' });
  }
};

// ============================================
// LISTAR ENVÍOS REALIZADOS POR EL ARTISTA
// ============================================
export const getMySubmissions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;

    const submissions = await db.prepare(`
      SELECT s.*, p.name as playlist_name, t.title as track_title
      FROM playlist_submissions s
      JOIN playlists p ON s.playlist_id = p.id
      JOIN tracks t ON s.track_id = t.id
      WHERE s.artist_id = ?
      ORDER BY s.submitted_at DESC
    `).all(artistId) as (SubmissionRow & { playlist_name: string; track_title: string })[];

    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener envíos' });
  }
};

// ============================================
// OBTENER DETALLE DE UN ENVÍO
// ============================================
export const getSubmissionById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const submission = await db.prepare(`
      SELECT s.*, p.name as playlist_name, t.title as track_title
      FROM playlist_submissions s
      JOIN playlists p ON s.playlist_id = p.id
      JOIN tracks t ON s.track_id = t.id
      WHERE s.id = ? AND s.artist_id = ?
    `).get(id, artistId) as (SubmissionRow & { playlist_name: string; track_title: string }) | undefined;

    if (!submission) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener envío' });
  }
};