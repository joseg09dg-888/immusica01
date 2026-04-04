import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';

// Definir interfaces para los resultados de las consultas
interface LandingPageRow {
  id: number;
  track_id: number;
  artist_id: number;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  youtube_url: string | null;
  other_url: string | null;
  config: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

interface LandingPageWithTrack extends LandingPageRow {
  track_title: string;
  track_cover: string | null;
  audio_url: string | null;
}

interface PageIdRow {
  id: number;
}

// Generar slug a partir del título
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .substring(0, 50);
};

// Crear una nueva landing page
export const createLandingPage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { track_id, title, description, cover_url, spotify_url, apple_music_url, youtube_url, other_url, config } = req.body;

    if (!track_id || !title) {
      return res.status(400).json({ error: 'track_id y title son obligatorios' });
    }

    // Obtener artist_id del usuario
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    // Verificar que el track pertenece al artista
    const track = await db.prepare('SELECT id FROM tracks WHERE id = ? AND artist_id = ?').get(track_id, artistId) as { id: number } | undefined;
    if (!track) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    // Generar slug único
    let slug = generateSlug(title);
    let counter = 1;
    let uniqueSlug = slug;
    while (await db.prepare('SELECT id FROM landing_pages WHERE slug = ?').get(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // Insertar landing page
    const result = await db.prepare(`
      INSERT INTO landing_pages
      (track_id, artist_id, slug, title, description, cover_url, spotify_url, apple_music_url, youtube_url, other_url, config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      track_id,
      artistId,
      uniqueSlug,
      title,
      description || null,
      cover_url || null,
      spotify_url || null,
      apple_music_url || null,
      youtube_url || null,
      other_url || null,
      config ? JSON.stringify(config) : null
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      slug: uniqueSlug,
      message: 'Landing page creada correctamente',
      url: `${process.env.FRONTEND_URL}/landing/${uniqueSlug}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear landing page' });
  }
};

// Obtener una landing page por slug (público)
export const getLandingPage = async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const page = await db.prepare(`
      SELECT lp.*, t.title as track_title, t.cover as track_cover, t.audio_url
      FROM landing_pages lp
      JOIN tracks t ON lp.track_id = t.id
      WHERE lp.slug = ?
    `).get(slug) as LandingPageWithTrack | undefined;

    if (!page) {
      return res.status(404).json({ error: 'Landing page no encontrada' });
    }

    // Parsear config si existe
    if (page.config) {
      page.config = JSON.parse(page.config);
    }

    res.json(page);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener landing page' });
  }
};

// Capturar lead (email) de un fan
export const captureLead = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es obligatorio' });
  }

  try {
    // Obtener el ID de la landing page
    const page = await db.prepare('SELECT id FROM landing_pages WHERE slug = ?').get(slug) as PageIdRow | undefined;
    if (!page) {
      return res.status(404).json({ error: 'Landing page no encontrada' });
    }

    // Insertar lead (si ya existe, ON CONFLICT lo ignora)
    const insert = await db.prepare(`
      INSERT OR IGNORE INTO leads (landing_page_id, email, name)
      VALUES (?, ?, ?)
    `);
    insert.run(page.id, email, name || null);

    res.json({ message: 'Lead capturado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al capturar lead' });
  }
};

// Listar landing pages del artista autenticado
export const getMyLandingPages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.json([]);
    const artistId = artists[0].id;

    const pages = await db.prepare(`
      SELECT lp.*, t.title as track_title,
      (SELECT COUNT(*) FROM leads WHERE landing_page_id = lp.id) as leads_count
      FROM landing_pages lp
      JOIN tracks t ON lp.track_id = t.id
      WHERE lp.artist_id = ?
      ORDER BY lp.created_at DESC
    `).all(artistId) as LandingPageRow[];

    res.json(pages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener landing pages' });
  }
};

// Eliminar una landing page (solo si es del artista)
export const deleteLandingPage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { id } = req.params;

    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    // Verificar que la página pertenezca al artista
    const page = await db.prepare('SELECT id FROM landing_pages WHERE id = ? AND artist_id = ?').get(id, artistId) as { id: number } | undefined;
    if (!page) {
      return res.status(404).json({ error: 'Landing page no encontrada o no pertenece al artista' });
    }

    await db.prepare('DELETE FROM landing_pages WHERE id = ?').run(id);
    res.json({ message: 'Landing page eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar landing page' });
  }
};