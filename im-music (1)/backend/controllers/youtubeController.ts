import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as YoutubeModel from '../models/Youtube';
import * as TrackModel from '../models/Track';
import * as ArtistModel from '../models/Artist';

export const registerContentId = async (req: AuthRequest, res: Response) => {
  try {
    const { track_id } = req.body;
    const track = TrackModel.getTrackById(parseInt(track_id));
    
    if (!track) return res.status(404).json({ error: 'Track no encontrado' });
    
    const registrationId = 'YT-CID-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    YoutubeModel.registerContentId(track.id, registrationId);
    
    res.json({
      message: 'Track registrado en YouTube Content ID',
      registration_id: registrationId,
      status: 'active'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar en Content ID' });
  }
};

export const getContentIds = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    
    const registrations = YoutubeModel.getAllContentIdsByArtist(artists[0].id);
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener registros de Content ID' });
  }
};
