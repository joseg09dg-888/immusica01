import db from '../database';

export interface Artist {
  id: number;
  user_id: number;
  name: string;
  genre: string | null;
  bio: string | null;
  tier: string;
  avatar: string | null;
  spotify_verified: number;
  created_at: string;
}

export const createArtist = async (artistData: { user_id: number; name: string; genre?: string; bio?: string; tier?: string; avatar?: string; spotify_verified?: number }): Promise<number> => {
  const result = await db.prepare(`
    INSERT INTO artists (user_id, name, genre, bio, tier, avatar, spotify_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).run(
    artistData.user_id,
    artistData.name,
    artistData.genre || null,
    artistData.bio || null,
    artistData.tier || 'Basic',
    artistData.avatar || null,
    artistData.spotify_verified || 0
  );
  return result.lastInsertRowid as number;
};

export const getArtistById = async (id: number): Promise<Artist | undefined> => {
  return db.prepare('SELECT * FROM artists WHERE id = ?').get(id) as Promise<Artist | undefined>;
};

export const updateArtist = async (id: number, data: Partial<Artist>): Promise<void> => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await db.prepare(`UPDATE artists SET ${fields} WHERE id = ?`).run(...values);
};

export const deleteArtist = async (id: number): Promise<void> => {
  await db.prepare('DELETE FROM artists WHERE id = ?').run(id);
};

export const getArtistsByUser = async (userId: number): Promise<Artist[]> => {
  return db.prepare('SELECT * FROM artists WHERE user_id = ?').all(userId) as Promise<Artist[]>;
};
