import db from '../config/database';

export interface Track {
  id: number;
  artist_id: number;
  title: string;
  release_date: string | null;
  cover: string | null;
  audio_url: string | null;
  status: string;
  isrc: string | null;
  upc: string | null;
  auto_distribute: boolean;
  leave_a_legacy: boolean;
  created_at: string;
}

export const createTrack = (
  artistId: number,
  title: string,
  releaseDate?: string,
  cover?: string,
  audioUrl?: string,
  isrc?: string,
  upc?: string
) => {
  const stmt = db.prepare(`
    INSERT INTO tracks (artist_id, title, release_date, cover, audio_url, isrc, upc)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(artistId, title, releaseDate, cover, audioUrl, isrc, upc);
};

export const getTracksByArtist = (artistId: number): Track[] => {
  return db.prepare('SELECT * FROM tracks WHERE artist_id = ? ORDER BY created_at DESC').all(artistId) as Track[];
};

export const getAllTracks = (): Track[] => {
  return db.prepare('SELECT * FROM tracks ORDER BY created_at DESC').all() as Track[];
};

export const getTrackById = (id: number): Track | undefined => {
  return db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Track | undefined;
};

export const updateTrack = (id: number, data: Partial<Track>) => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  const stmt = db.prepare(`UPDATE tracks SET ${fields} WHERE id = ?`);
  return stmt.run(...values, id);
};

export const deleteTrack = (id: number) => {
  return db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
};

// Lyrics
export const saveLyrics = (trackId: number, lyrics: string, type: 'plain' | 'synced') => {
  const existing = db.prepare('SELECT id FROM lyrics WHERE track_id = ? AND type = ?').get(trackId, type);
  if (existing) {
    return db.prepare('UPDATE lyrics SET lyrics = ? WHERE id = ?').run(lyrics, (existing as any).id);
  }
  return db.prepare('INSERT INTO lyrics (track_id, lyrics, type) VALUES (?, ?, ?)').run(trackId, lyrics, type);
};

export const getLyrics = (trackId: number) => {
  return db.prepare('SELECT * FROM lyrics WHERE track_id = ?').all(trackId);
};

// Scheduled Releases
export const scheduleRelease = (trackId: number, releaseDate: string, platforms: string[]) => {
  return db.prepare('INSERT INTO scheduled_releases (track_id, release_date, platforms) VALUES (?, ?, ?)').run(
    trackId,
    releaseDate,
    JSON.stringify(platforms)
  );
};

export const getScheduledReleasesByArtist = (artistId: number) => {
  return db.prepare(`
    SELECT sr.*, t.title as track_title 
    FROM scheduled_releases sr
    JOIN tracks t ON sr.track_id = t.id
    WHERE t.artist_id = ?
    ORDER BY sr.release_date ASC
  `).all(artistId);
};

export const cancelScheduledRelease = (id: number) => {
  return db.prepare('UPDATE scheduled_releases SET status = "cancelled" WHERE id = ?').run(id);
};
