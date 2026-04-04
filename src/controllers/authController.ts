import { Request, Response } from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev-key';

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

export const loginEmail = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login email:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son obligatorios' });
    }

    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)').run(email, hashed, name, 'artist');

    const user = await db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(email) as any;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ error: 'Error al registrar' });
  }
};
