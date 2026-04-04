import db from '../config/database';

export interface SpotifyToken {
  id: number;
  artist_id: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
}

export const saveSpotifyToken = async (data: Omit<SpotifyToken, 'id' | 'created_at'>) => {
  const existing = await db.prepare('SELECT id FROM spotify_tokens WHERE artist_id = ?').get(data.artist_id);

  if (existing) {
    return db.prepare(`
      UPDATE spotify_tokens
      SET access_token = ?, refresh_token = ?, expires_at = ?
      WHERE artist_id = ?
    `).run(data.access_token, data.refresh_token, data.expires_at, data.artist_id);
  } else {
    return db.prepare(`
      INSERT INTO spotify_tokens (artist_id, access_token, refresh_token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(data.artist_id, data.access_token, data.refresh_token, data.expires_at);
  }
};

export const getSpotifyTokenByArtist = async (artistId: number): Promise<SpotifyToken | undefined> => {
  return db.prepare('SELECT * FROM spotify_tokens WHERE artist_id = ?').get(artistId) as Promise<SpotifyToken | undefined>;
};

export const deleteSpotifyToken = async (artistId: number) => {
  return db.prepare('DELETE FROM spotify_tokens WHERE artist_id = ?').run(artistId);
};
