import db from '../config/database';

export interface SpotifyToken {
  id: number;
  artist_id: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
}

export const saveSpotifyToken = (data: Omit<SpotifyToken, 'id' | 'created_at'>) => {
  // Verificar si ya existe un token para este artista
  const existing = db.prepare('SELECT id FROM spotify_tokens WHERE artist_id = ?').get(data.artist_id);
  
  if (existing) {
    // Actualizar
    const stmt = db.prepare(`
      UPDATE spotify_tokens
      SET access_token = ?, refresh_token = ?, expires_at = ?
      WHERE artist_id = ?
    `);
    return stmt.run(data.access_token, data.refresh_token, data.expires_at, data.artist_id);
  } else {
    // Insertar nuevo
    const stmt = db.prepare(`
      INSERT INTO spotify_tokens (artist_id, access_token, refresh_token, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(data.artist_id, data.access_token, data.refresh_token, data.expires_at);
  }
};

export const getSpotifyTokenByArtist = (artistId: number): SpotifyToken | undefined => {
  return db.prepare('SELECT * FROM spotify_tokens WHERE artist_id = ?').get(artistId) as SpotifyToken | undefined;
};

export const deleteSpotifyToken = (artistId: number) => {
  return db.prepare('DELETE FROM spotify_tokens WHERE artist_id = ?').run(artistId);
};