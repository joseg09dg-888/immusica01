import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as MoodPlaylistModel from '../models/MoodPlaylist';
import * as SpotifyTokenModel from '../models/SpotifyToken';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import querystring from 'querystring';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/mood/callback';

// ============================================
// 1. OBTENER URL DE AUTORIZACIÓN DE SPOTIFY
// ============================================
export const getSpotifyAuthUrl = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });

  const scope = 'playlist-modify-private playlist-modify-public user-read-private user-read-email';
  const authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: scope,
    state: req.user.id.toString()
  });

  res.json({ authUrl });
};

// ============================================
// 2. CALLBACK DE SPOTIFY (recibe el código)
// ============================================
export const spotifyCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;

  // Validar y convertir code a string de forma segura
  const codeStr = Array.isArray(code) ? code[0] : code;
  if (!codeStr || typeof codeStr !== 'string') {
    return res.status(400).json({ error: 'Código no proporcionado o inválido' });
  }

  const artistId = parseInt(state as string);
  if (isNaN(artistId)) {
    return res.status(400).json({ error: 'ID de artista inválido' });
  }

  try {
    interface TokenResponse {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }

    const tokenResponse = await axios.post<TokenResponse>(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code: codeStr,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

    await SpotifyTokenModel.saveSpotifyToken({
      artist_id: artistId,
      access_token,
      refresh_token,
      expires_at
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}?spotify=connected`);
  } catch (error) {
    console.error('Error en callback de Spotify:', error);
    res.status(500).json({ error: 'Error al conectar con Spotify' });
  }
};

// ============================================
// 3. GENERAR PLAYLIST POR MOOD
// ============================================
export const generateMoodPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'No hay artista asociado' });
    const artist = artists[0];

    const { mood_description } = req.body;
    if (!mood_description) return res.status(400).json({ error: 'Descripción de mood requerida' });

    const tokenData = await SpotifyTokenModel.getSpotifyTokenByArtist(artist.id);
    if (!tokenData) {
      return res.status(401).json({ error: 'Debes conectar tu cuenta de Spotify primero' });
    }

    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date()) {
      interface RefreshResponse {
        access_token: string;
        expires_in: number;
      }

      const refreshResponse = await axios.post<RefreshResponse>(
        'https://accounts.spotify.com/api/token',
        querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: tokenData.refresh_token,
          client_id: SPOTIFY_CLIENT_ID,
          client_secret: SPOTIFY_CLIENT_SECRET
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      accessToken = refreshResponse.data.access_token;
      const newExpiresAt = new Date(Date.now() + refreshResponse.data.expires_in * 1000).toISOString();
      await SpotifyTokenModel.saveSpotifyToken({
        artist_id: artist.id,
        access_token: accessToken,
        refresh_token: tokenData.refresh_token,
        expires_at: newExpiresAt
      });
    }

    const prompt = `
      Eres un experto musical. Basado en la siguiente descripción de mood, genera 10 consultas de búsqueda para encontrar canciones en Spotify que coincidan perfectamente con ese sentimiento.
      
      Descripción: "${mood_description}"
      
      Las consultas deben ser específicas, combinando artistas y canciones reales que ejemplifiquen ese mood.
      Formato: Un array JSON de strings, cada uno con formato "artista - canción" o simplemente el nombre de la canción.
      
      Ejemplo: ["Adele - Hello", "Coldplay - The Scientist", "Imagine Dragons - Believer"]
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Error al generar consultas' });
    }

    const searchQueries = JSON.parse(jsonMatch[0]) as string[];

    interface UserProfile {
      id: string;
      display_name: string;
      email?: string;
    }

    const userProfileResponse = await axios.get<UserProfile>('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const userId = userProfileResponse.data.id;

    interface CreatePlaylistResponse {
      id: string;
      external_urls: {
        spotify: string;
      };
    }

    const createPlaylistResponse = await axios.post<CreatePlaylistResponse>(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: `Mood: ${mood_description.substring(0, 50)}`,
        description: `Playlist generada por IA basada en: ${mood_description}`,
        public: false
      },
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    const playlistId = createPlaylistResponse.data.id;
    const playlistUrl = createPlaylistResponse.data.external_urls.spotify;

    const trackUris: string[] = [];

    interface TrackSearchResponse {
      tracks: {
        items: Array<{
          uri: string;
        }>;
      };
    }

    for (const query of searchQueries) {
      try {
        const searchResponse = await axios.get<TrackSearchResponse>('https://api.spotify.com/v1/search', {
          params: {
            q: query,
            type: 'track',
            limit: 1
          },
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (searchResponse.data.tracks.items.length > 0) {
          trackUris.push(searchResponse.data.tracks.items[0].uri);
        }
      } catch (e) {
        console.error(`Error buscando ${query}:`, e);
      }
    }

    if (trackUris.length > 0) {
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: trackUris.slice(0, 100) },
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
    }

    await MoodPlaylistModel.createMoodPlaylist({
      artist_id: artist.id,
      mood_description,
      playlist_url: playlistUrl,
      playlist_id: playlistId,
      tracks_count: trackUris.length,
      valence: null,
      energy: null
    });

    res.json({
      success: true,
      playlistUrl,
      tracksFound: trackUris.length,
      mood_description
    });
  } catch (error) {
    console.error('Error generando playlist:', error);
    res.status(500).json({ error: 'Error al generar playlist' });
  }
};

// ============================================
// 4. OBTENER HISTORIAL DE PLAYLISTS DEL ARTISTA
// ============================================
export const getMyPlaylists = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'No hay artista asociado' });
    const artist = artists[0];

    const playlists = MoodPlaylistModel.getPlaylistsByArtist(artist.id);
    res.json(playlists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener playlists' });
  }
};

// ============================================
// 5. VERIFICAR CONEXIÓN CON SPOTIFY
// ============================================
export const checkSpotifyConnection = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'No hay artista asociado' });
    const artist = artists[0];

    const token = await SpotifyTokenModel.getSpotifyTokenByArtist(artist.id);
    res.json({ connected: !!token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al verificar conexión' });
  }
};