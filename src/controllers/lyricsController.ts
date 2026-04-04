import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../database';
import * as ArtistModel from '../models/Artist';
import * as TrackModel from '../models/Track';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

// Configurar multer para subida de archivos .lrc
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/lyrics');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lyrics-' + uniqueSuffix + '.lrc');
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.lrc')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .lrc o .txt'));
    }
  }
});

// Interfaces para tipado
interface LyricsRow {
  id: number;
  track_id: number;
  lyrics_text: string | null;
  synced_lyrics: string | null;
  language: string | null;
  is_synced: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// SUBIR LETRAS SINCRONIZADAS (.lrc)
// ============================================
export const uploadLyrics = [
  upload.single('lyrics'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

      const { trackId, language } = req.body;
      if (!trackId) {
        return res.status(400).json({ error: 'trackId es obligatorio' });
      }

      // Validar que trackId sea un string y convertirlo a número
      const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
      const trackIdNum = parseInt(trackIdStr, 10);
      if (isNaN(trackIdNum)) {
        return res.status(400).json({ error: 'trackId inválido' });
      }

      // Verificar que el track pertenece al artista
      const artists = await ArtistModel.getArtistsByUser(req.user.id);
      if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
      const artistId = artists[0].id;

      const track = await TrackModel.getTrackById(trackIdNum);
      if (!track || track.artist_id !== artistId) {
        return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
      }

      // Leer el archivo subido
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Determinar si es letra sincronizada (contiene timestamps [mm:ss.xx])
      const isSynced = /\[\d{2}:\d{2}\.\d{2}\]/.test(fileContent);

      // Guardar en base de datos
      const insert = await db.prepare(`
        INSERT INTO track_lyrics (track_id, synced_lyrics, lyrics_text, language, is_synced)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(track_id) DO UPDATE SET
          synced_lyrics = excluded.synced_lyrics,
          lyrics_text = excluded.lyrics_text,
          language = excluded.language,
          is_synced = excluded.is_synced,
          updated_at = CURRENT_TIMESTAMP
      `);

      insert.run(
        trackIdNum,
        isSynced ? fileContent : null,
        !isSynced ? fileContent : null,
        language || null,
        isSynced ? 1 : 0
      );

      res.json({
        message: 'Letras subidas correctamente',
        isSynced,
        trackId: trackIdNum
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir letras' });
    }
  }
];

// ============================================
// SUBIR LETRA TEXTO PLANO (no sincronizada)
// ============================================
export const uploadPlainLyrics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId, lyrics, language } = req.body;
    if (!trackId || !lyrics) {
      return res.status(400).json({ error: 'trackId y lyrics son obligatorios' });
    }

    // Validar trackId
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
      return res.status(400).json({ error: 'trackId inválido' });
    }

    // Verificar propiedad del track
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = await TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    // Guardar en base de datos
    const insert = await db.prepare(`
      INSERT INTO track_lyrics (track_id, lyrics_text, language, is_synced)
      VALUES (?, ?, ?, 0)
      ON CONFLICT(track_id) DO UPDATE SET
        lyrics_text = excluded.lyrics_text,
        language = excluded.language,
        is_synced = 0,
        synced_lyrics = NULL,
        updated_at = CURRENT_TIMESTAMP
    `);

    insert.run(trackIdNum, lyrics, language || null);

    res.json({
      message: 'Letra guardada correctamente',
      trackId: trackIdNum
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar letra' });
  }
};

// ============================================
// OBTENER LETRAS DE UN TRACK
// ============================================
export const getLyrics = async (req: AuthRequest, res: Response) => {
  const { trackId } = req.params;
  const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
  const trackIdNum = parseInt(trackIdStr, 10);
  if (isNaN(trackIdNum)) {
    return res.status(400).json({ error: 'trackId inválido' });
  }

  try {
    const lyrics = await db.prepare(`
      SELECT * FROM track_lyrics WHERE track_id = ?
    `).get(trackIdNum) as LyricsRow | undefined;

    if (!lyrics) {
      return res.status(404).json({ error: 'Este track no tiene letras' });
    }

    res.json(lyrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener letras' });
  }
};

// ============================================
// ELIMINAR LETRAS DE UN TRACK
// ============================================
export const deleteLyrics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });

    const { trackId } = req.params;
    const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
    const trackIdNum = parseInt(trackIdStr, 10);
    if (isNaN(trackIdNum)) {
      return res.status(400).json({ error: 'trackId inválido' });
    }

    // Verificar propiedad del track
    const artists = await ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });
    const artistId = artists[0].id;

    const track = await TrackModel.getTrackById(trackIdNum);
    if (!track || track.artist_id !== artistId) {
      return res.status(404).json({ error: 'Track no encontrado o no pertenece al artista' });
    }

    await db.prepare('DELETE FROM track_lyrics WHERE track_id = ?').run(trackIdNum);

    res.json({ message: 'Letras eliminadas correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar letras' });
  }
};

// ============================================
// EXPORTAR LETRAS PARA PLATAFORMAS (formato LRC)
// ============================================
export const exportLyrics = async (req: AuthRequest, res: Response) => {
  const { trackId } = req.params;
  const { format } = req.query; // lrc, txt, json

  const trackIdStr = Array.isArray(trackId) ? trackId[0] : trackId;
  const trackIdNum = parseInt(trackIdStr, 10);
  if (isNaN(trackIdNum)) {
    return res.status(400).json({ error: 'trackId inválido' });
  }

  try {
    const lyrics = await db.prepare(`
      SELECT * FROM track_lyrics WHERE track_id = ?
    `).get(trackIdNum) as LyricsRow | undefined;

    if (!lyrics) {
      return res.status(404).json({ error: 'No hay letras para este track' });
    }

    // Si hay letras sincronizadas y se pide formato lrc, devolver archivo
    if (lyrics.synced_lyrics && format === 'lrc') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="track-${trackIdNum}.lrc"`);
      return res.send(lyrics.synced_lyrics);
    }

    // Si no, devolver JSON con las letras
    res.json(lyrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar letras' });
  }
};