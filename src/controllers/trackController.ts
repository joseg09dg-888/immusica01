import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';

export const getMyTracks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;
    const tracks = await TrackModel.getTracksByArtist(artistId);
    res.json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tracks' });
  }
};

export const createTrack = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Crea un artista primero' });
    const { title, release_date, scheduled_date, cover, audio_url, isrc, upc, status } = req.body;
    if (!title) return res.status(400).json({ error: 'El título es obligatorio' });
    const trackId = await TrackModel.createTrack({
      artist_id: artists[0].id,
      title,
      release_date,
      scheduled_date,
      cover,
      audio_url,
      isrc,
      upc,
      status
    });
    res.status(201).json({ id: trackId, message: 'Track creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear track' });
  }
};

export const getTrackById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const track = await TrackModel.getTrackById(id);
    if (!track) return res.status(404).json({ error: 'Track no encontrado' });
    res.json(track);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener track' });
  }
};

export const updateTrack = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    await TrackModel.updateTrack(id, req.body);
    res.json({ message: 'Track actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar track' });
  }
};

export const deleteTrack = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    await TrackModel.deleteTrack(id);
    res.json({ message: 'Track eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar track' });
  }
};
