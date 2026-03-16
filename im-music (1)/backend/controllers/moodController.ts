import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI || `${process.env.APP_URL}/api/mood/callback`;

let spotifyToken: string | null = null;

export const spotifyLogin = (req: Request, res: Response) => {
  const scope = 'user-read-private user-read-email';
  const state = 'some-state'; // In a real app, use a random string

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: client_id || '',
    scope: scope,
    redirect_uri: redirect_uri,
    state: state
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
};

export const spotifyCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      }).toString(),
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    spotifyToken = response.data.access_token;
    
    // Redirect back to the app
    res.send(`
      <html>
        <body>
          <script>
            window.close();
          </script>
          <p>Autenticación exitosa. Puedes cerrar esta ventana.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    res.status(500).send('Error during Spotify authentication');
  }
};

export const getRecommendations = async (req: Request, res: Response) => {
  const mood = req.query.mood as string;
  const limit = req.query.limit || '12';

  if (!spotifyToken) {
    return res.status(401).json({ error: 'Spotify authentication required' });
  }

  const moodParams: any = {
    alegre: { target_valence: 0.8, target_energy: 0.7, seed_genres: 'pop,happy' },
    triste: { target_valence: 0.2, target_energy: 0.3, seed_genres: 'sad,blues' },
    energético: { target_energy: 0.9, target_danceability: 0.8, seed_genres: 'dance,edm' },
    relajado: { target_energy: 0.2, target_acousticness: 0.7, seed_genres: 'chill,ambient' },
    romántico: { target_valence: 0.6, target_acousticness: 0.5, seed_genres: 'romance,soul' },
    agresivo: { target_energy: 0.9, target_loudness: -5, seed_genres: 'metal,hard-rock' },
    feliz: { target_valence: 0.9, target_energy: 0.8, seed_genres: 'pop,funk' },
    melancólico: { target_valence: 0.1, target_acousticness: 0.8, seed_genres: 'acoustic,folk' },
  };

  const params = moodParams[mood] || { seed_genres: 'pop' };

  try {
    const response = await axios.get('https://api.spotify.com/v1/recommendations', {
      params: {
        limit,
        ...params
      },
      headers: {
        'Authorization': `Bearer ${spotifyToken}`
      }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching Spotify recommendations:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      spotifyToken = null;
      return res.status(401).json({ error: 'Spotify token expired' });
    }
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};
