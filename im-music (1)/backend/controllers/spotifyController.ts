import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import dotenv from 'dotenv';

dotenv.config();

export const getSpotifyAuthUrl = (req: AuthRequest, res: Response) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL}/api/artists/spotify/callback`;
  const scope = 'user-read-private user-read-email';
  
  const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  res.json({ url });
};

export const spotifyCallback = async (req: AuthRequest, res: Response) => {
  const { code, state } = req.query;
  // In a real app, we would exchange the code for a token
  // For this simulation, we'll just mark the current artist as verified
  
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    
    const artist = artists[0];
    ArtistModel.updateArtist(artist.id, {
      spotify_verified: true,
      spotify_id: 'simulated_spotify_id_' + Math.random().toString(36).substring(7)
    });
    
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
          <p>Verificación exitosa. Puedes cerrar esta ventana.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la verificación de Spotify');
  }
};

export const checkSpotifyStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    
    const artist = artists[0];
    res.json({ verified: artist.spotify_verified, spotify_id: artist.spotify_id });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar estado de Spotify' });
  }
};
