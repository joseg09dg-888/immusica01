import { Request, Response } from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import { getRecommendationsForMood } from '../services/moodService';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { mood, limit = 10 } = req.query;

    if (!mood) {
      return res.status(400).json({ error: 'El parámetro "mood" es requerido' });
    }

    const recommendations = await getRecommendationsForMood(
      spotifyApi,
      mood as string,
      Number(limit)
    );

    res.json(recommendations);
  } catch (error: any) {
    console.error('Error en getRecommendations:', error);
    res.status(500).json({
      error: 'Error al obtener recomendaciones de Spotify',
      details: error.message,
      code: error.code || 'UNKNOWN',
    });
  }
};