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

export const createMoodPlaylist = async (data: Omit<MoodPlaylist, 'id' | 'created_at'>) => {
  return db.prepare(`
    INSERT INTO mood_playlists (artist_id, mood_description, playlist_url, playlist_id, tracks_count, valence, energy)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.artist_id, data.mood_description, data.playlist_url, data.playlist_id, data.tracks_count, data.valence, data.energy);
};

export const getPlaylistsByArtist = async (artistId: number): Promise<MoodPlaylist[]> => {
  return db.prepare('SELECT * FROM mood_playlists WHERE artist_id = ? ORDER BY created_at DESC').all(artistId) as Promise<MoodPlaylist[]>;
};

export const getPlaylistById = async (id: number): Promise<MoodPlaylist | undefined> => {
  return db.prepare('SELECT * FROM mood_playlists WHERE id = ?').get(id) as Promise<MoodPlaylist | undefined>;
};
