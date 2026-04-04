import db from '../database';

export interface UserArtist {
  id: number;
  user_id: number;
  artist_id: number;
  role: string;
  created_at: string;
}

export const assignUserToArtist = async (userId: number, artistId: number, role: string = 'manager'): Promise<number> => {
  const result = await db.prepare(`
    INSERT INTO user_artists (user_id, artist_id, role)
    VALUES (?, ?, ?)
    ON CONFLICT (user_id, artist_id) DO NOTHING
  `).run(userId, artistId, role);
  return result.lastInsertRowid as number;
};

export const getArtistsByUser = async (userId: number): Promise<UserArtist[]> => {
  return db.prepare(`
    SELECT ua.*, a.name as artist_name, a.genre, a.tier
    FROM user_artists ua
    JOIN artists a ON ua.artist_id = a.id
    WHERE ua.user_id = ?
  `).all(userId) as Promise<UserArtist[]>;
};

export const getUsersByArtist = async (artistId: number): Promise<UserArtist[]> => {
  return db.prepare(`
    SELECT ua.*, u.email, u.name as user_name
    FROM user_artists ua
    JOIN users u ON ua.user_id = u.id
    WHERE ua.artist_id = ?
  `).all(artistId) as Promise<UserArtist[]>;
};

export const removeUserFromArtist = async (userId: number, artistId: number): Promise<void> => {
  await db.prepare('DELETE FROM user_artists WHERE user_id = ? AND artist_id = ?').run(userId, artistId);
};

export const getUserArtistRole = async (userId: number, artistId: number): Promise<string | null> => {
  const result = await db.prepare('SELECT role FROM user_artists WHERE user_id = ? AND artist_id = ?').get(userId, artistId) as { role: string } | undefined;
  return result?.role || null;
};
