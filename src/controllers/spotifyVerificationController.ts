import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import SpotifyWebApi from 'spotify-web-api-node';

// Configurar Spotify API (usando las credenciales del .env)
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Interfaz para el resultado de la búsqueda de artista
interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: { spotify: string };
  followers?: { total: number };
  images?: { url: string }[];
}

// ============================================
// 1. Obtener estado de verificación del artista
// ============================================
export const getVerificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    // Obtener el artista principal del usuario (asumimos que es el primero)
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) {
      return res.status(404).json({ error: 'No tienes artistas registrados' });
    }
    const artist = artists[0];

    // Devolver el estado actual
    res.json({
      artistId: artist.id,
      artistName: artist.name,
      spotifyVerified: artist.spotify_verified || false,
      // Si no está verificado, podemos sugerir que inicie sesión
      message: artist.spotify_verified ? 'Verificado' : 'No verificado'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estado de verificación' });
  }
};

// ============================================
// 2. Iniciar el flujo de verificación (login con Spotify)
// ============================================
export const startVerification = (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    // Definir los scopes necesarios (acceso a la información del artista)
    const scopes = ['user-read-email', 'user-read-private', 'user-top-read'];
    
    // Generar URL de autorización de Spotify
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'spotify-verification');
    
    // Redirigir al usuario a la página de autorización de Spotify
    res.redirect(authorizeURL);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar verificación' });
  }
};

// ============================================
// 3. Callback después del login de Spotify
// ============================================
export const verificationCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('No se recibió el código de autorización');
  }

  try {
    // Intercambiar el código por un token de acceso
    const data = await spotifyApi.authorizationCodeGrant(code as string);
    const { access_token, refresh_token } = data.body;

    // Configurar el token en la API de Spotify
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    // Obtener información del usuario de Spotify
    const me = await spotifyApi.getMe();
    const spotifyUser = me.body;

    // Ahora necesitamos saber a qué artista de nuestra plataforma corresponde este usuario.
    // Podemos buscar por email (si coincide) o pedirle que seleccione un artista.
    // Por simplicidad, asumiremos que el email del usuario de Spotify coincide con el email de nuestra base de datos.
    const dbUser = db.prepare('SELECT id FROM users WHERE email = ?').get(spotifyUser.email) as { id: number } | undefined;
    if (!dbUser) {
      return res.status(404).send('Usuario no encontrado en IM Music');
    }

    // Buscar el artista asociado a ese usuario
    const artists = ArtistModel.getArtistsByUser(dbUser.id);
    if (artists.length === 0) {
      return res.status(404).send('El usuario no tiene artistas registrados');
    }
    const artist = artists[0];

    // Ahora podemos buscar el artista en Spotify por nombre para ver si está verificado
    // Esto es una aproximación; en realidad, la verificación oficial se hace a través de Spotify for Artists.
    const searchResult = await spotifyApi.searchArtists(artist.name);
    const items = searchResult.body.artists?.items || [];
    
    // Buscar el artista que coincida exactamente (primer resultado)
    const spotifyArtist = items.find((a: SpotifyArtist) => a.name.toLowerCase() === artist.name.toLowerCase());

    let verified = false;
    if (spotifyArtist) {
      // En Spotify, los artistas verificados tienen un badge; pero no es fácil detectarlo.
      // Podemos asumir que si existe, está "verificado" en el sentido de que tiene un perfil.
      // Para una verificación real, necesitarías acceder a Spotify for Artists API.
      verified = true; // Simplificación
    }

    // Actualizar la base de datos
    db.prepare('UPDATE artists SET spotify_verified = ? WHERE id = ?').run(verified ? 1 : 0, artist.id);

    // Guardar tokens para futuras consultas (opcional)
    // Podrías guardarlos en una tabla spotify_tokens

    // Redirigir al frontend con un mensaje
    res.send(`
      <h1>${verified ? '✅ Verificación completada' : '⚠️ No se pudo verificar'}</h1>
      <p>Puedes cerrar esta ventana y volver a la aplicación.</p>
      <a href="${process.env.FRONTEND_URL}/artist/verification">Volver a IM Music</a>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la verificación con Spotify');
  }
};