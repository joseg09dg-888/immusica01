import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import crypto from 'crypto';

// ============================================
// REGISTRAR UN TRACK EN YOUTUBE CONTENT ID (SIMULADO)
// ============================================
export const registerInYouTube = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.body;
    if (!trackId) {
      return res.status(400).json({ error: 'trackId es obligatorio' });
    }

    // Verificar que el track pertenezca al artista
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = await TrackModel.getTrackById(trackId);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    // Verificar si ya está registrado
    const existing = await db.prepare('SELECT id FROM youtube_content_id WHERE track_id = ?').get(trackId);
    if (existing) {
      return res.status(400).json({ error: 'Este track ya ha sido registrado en YouTube Content ID' });
    }

    // Generar un ID de registro simulado
    const registrationId = crypto.randomBytes(16).toString('hex');

    // Simular registro (en un caso real, aquí se llamaría a la API de YouTube)
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO youtube_content_id (track_id, registration_id, status, registered_at)
      VALUES (?, ?, 'registered', ?)
    `).run(trackId, registrationId, now);

    res.status(201).json({
      message: 'Track registrado en YouTube Content ID (simulado)',
      registrationId,
      trackId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar en YouTube' });
  }
};

// ============================================
// OBTENER ESTADO DE REGISTRO DE UN TRACK
// ============================================
export const getYouTubeStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;
    // Manejar si trackId es un array (por seguridad)
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
      return res.status(400).json({ error: 'ID de track inválido' });
    }

    // Verificar propiedad
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = await TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    const status = db.prepare(`
      SELECT * FROM youtube_content_id WHERE track_id = ?
    `).get(trackIdNum);

    if (!status) {
      return res.status(404).json({ error: 'Este track no ha sido registrado en YouTube Content ID' });
    }

    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
};

// ============================================
// LISTAR TODOS LOS REGISTROS DEL ARTISTA
// ============================================
export const listMyYouTubeRegistrations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;

    // Obtener todos los tracks del artista
    const tracks = await db.prepare('SELECT id FROM tracks WHERE artist_id = ?').all(artistId) as { id: number }[];
    if (tracks.length === 0) return res.json([]);

    const placeholders = tracks.map(() => '?').join(',');
    const trackIds = tracks.map(t => t.id);

    const registrations = db.prepare(`
      SELECT y.*, t.title as track_title
      FROM youtube_content_id y
      JOIN tracks t ON y.track_id = t.id
      WHERE y.track_id IN (${placeholders})
      ORDER BY y.created_at DESC
    `).all(...trackIds);

    res.json(registrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar registros' });
  }
};