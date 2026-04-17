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
  auto_distribute: number;
  is_legacy: number;
  legacy_purchased_at: string | null;
  created_at: string;
}

export const createTrack = async (trackData: {
  artist_id: number;
  title: string;
  genre?: string | null;
  release_date?: string | null;
  scheduled_date?: string | null;
  cover?: string | null;
  audio_url?: string | null;
  status?: string;
  isrc?: string | null;
  upc?: string | null;
}): Promise<number> => {
  const result = await db.prepare(`
    INSERT INTO tracks (
      artist_id, title, genre, release_date, scheduled_date, cover, audio_url, status, isrc, upc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).get(
    trackData.artist_id,
    trackData.title,
    trackData.genre || null,
    trackData.release_date || null,
    trackData.scheduled_date || null,
    trackData.cover || null,
    trackData.audio_url || null,
    trackData.status || 'draft',
    trackData.isrc || null,
    trackData.upc || null
  ) as { id: number } | undefined;
  return result?.id ?? 0;
};

export const getTrackById = async (id: number): Promise<Track | undefined> => {
  return db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Promise<Track | undefined>;
};

export const getTracksByArtist = async (artistId: number): Promise<Track[]> => {
  return db.prepare('SELECT * FROM tracks WHERE artist_id = ? ORDER BY created_at DESC').all(artistId) as Promise<Track[]>;
};

export const updateTrack = async (id: number, data: Partial<Track>): Promise<void> => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await db.prepare(`UPDATE tracks SET ${fields} WHERE id = ?`).run(...values);
};

export const deleteTrack = async (id: number): Promise<void> => {
  await db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
};
