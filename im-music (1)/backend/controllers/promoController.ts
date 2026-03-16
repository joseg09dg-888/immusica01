import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as TrackModel from '../models/Track';
import * as ArtistModel from '../models/Artist';

export const generateReel = async (req: AuthRequest, res: Response) => {
  try {
    const { track_id, message } = req.body;
    const track = TrackModel.getTrackById(parseInt(track_id));
    
    if (!track) return res.status(404).json({ error: 'Track no encontrado' });
    
    const artist = ArtistModel.getArtistById(track.artist_id);
    
    // Simulate FFmpeg video generation
    // In a real app, we would use ffmpeg to combine cover + audio + text
    
    const simulatedVideoUrl = `https://res.cloudinary.com/demo/video/upload/v1/promo_reel_${track_id}.mp4`;
    
    res.json({
      message: 'Video promocional generado con éxito',
      video_url: simulatedVideoUrl,
      details: {
        title: track.title,
        artist: artist?.name,
        promo_text: message || '¡Nuevo lanzamiento disponible!'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el video promocional' });
  }
};
