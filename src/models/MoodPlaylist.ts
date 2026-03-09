import db from '../config/database';

export interface MoodPlaylist {
  id: number;
  artist_id: number;
  mood_description: string;
  playlist_url: string;
  playlist_id: string;
  tracks_count: number;
  valence: number | null;
  energy: number | null;
  created_at: string;
}

export const createMoodPlaylist = (data: Omit<MoodPlaylist, 'id' | 'created_at'>) => {
  const stmt = db.prepare(`
    INSERT INTO mood_playlists (artist_id, mood_description, playlist_url, playlist_id, tracks_count, valence, energy)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.artist_id,
    data.mood_description,
    data.playlist_url,
    data.playlist_id,
    data.tracks_count,
    data.valence,
    data.energy
  );
};

export const getPlaylistsByArtist = (artistId: number): MoodPlaylist[] => {
  return db.prepare('SELECT * FROM mood_playlists WHERE artist_id = ? ORDER BY created_at DESC').all(artistId) as MoodPlaylist[];
};

export const getPlaylistById = (id: number): MoodPlaylist | undefined => {
  return db.prepare('SELECT * FROM mood_playlists WHERE id = ?').get(id) as MoodPlaylist | undefined;
};