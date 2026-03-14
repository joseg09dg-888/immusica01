import db from '../database';

export interface Track {
  id: number;
  artist_id: number;
  title: string;
  release_date: string | null;
  scheduled_date: string | null;
  published_at: string | null;
  cover: string | null;
  audio_url: string | null;
  status: string;
  isrc: string | null;
  upc: string | null;
  auto_distribute: number; // 0 o 1
  is_legacy: number;       // 0 o 1
  legacy_purchased_at: string | null;
  created_at: string;
}

// Crear un nuevo track
export const createTrack = (trackData: {
  artist_id: number;
  title: string;
  release_date?: string | null;
  scheduled_date?: string | null;
  cover?: string | null;
  audio_url?: string | null;
  status?: string;
  isrc?: string | null;
  upc?: string | null;
}): number => {
  const stmt = db.prepare(`
    INSERT INTO tracks (
      artist_id, title, release_date, scheduled_date, cover, audio_url, status, isrc, upc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    trackData.artist_id,
    trackData.title,
    trackData.release_date || null,
    trackData.scheduled_date || null,
    trackData.cover || null,
    trackData.audio_url || null,
    trackData.status || 'draft',
    trackData.isrc || null,
    trackData.upc || null
  );
  return result.lastInsertRowid as number;
};

// Obtener un track por ID
export const getTrackById = (id: number): Track | undefined => {
  return db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Track | undefined;
};

// Obtener todos los tracks de un artista
export const getTracksByArtist = (artistId: number): Track[] => {
  return db.prepare('SELECT * FROM tracks WHERE artist_id = ? ORDER BY created_at DESC').all(artistId) as Track[];
};

// Actualizar un track
export const updateTrack = (id: number, data: Partial<Track>): void => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];
  db.prepare(`UPDATE tracks SET ${fields} WHERE id = ?`).run(...values);
};

// Eliminar un track
export const deleteTrack = (id: number): void => {
  db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
};