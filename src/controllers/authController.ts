import { Request, Response } from 'express';
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export const login = (req: Request, res: Response) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-modify-public'
  ];
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state-123');
  res.redirect(authorizeURL);
};

export const callback = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('No se recibió el código de autorización');
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code as string);
    const { access_token, refresh_token } = data.body;

    (global as any).spotifyAccessToken = access_token;
    (global as any).spotifyRefreshToken = refresh_token;

    res.send(`
      <h1>✅ Autenticación exitosa</h1>
      <p>Ya puedes usar <strong>/api/mood/recommendations?mood=alegre</strong></p>
      <a href="/api/mood/recommendations?mood=alegre">Probar ahora</a>
    `);
  } catch (error) {
    console.error('Error al obtener token:', error);
    res.status(500).send('Error al autenticar con Spotify');
  }
};