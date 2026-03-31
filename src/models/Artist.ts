import db from '../database';

export interface Artist {
  id: number;
  user_id: number;
  name: string;
  genre: string | null;
  bio: string | null;
  tier: string;
  avatar: string | null;
  spotify_verified: number; // 0 o 1, nueva propiedad
  created_at: string;
}

// Crear un artista
export const createArtist = (artistData: { user_id: number; name: string; genre?: string; bio?: string; tier?: string; avatar?: string; spotify_verified?: number }): number => {
  const stmt = db.prepare(`
    INSERT INTO artists (user_id, name, genre, bio, tier, avatar, spotify_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
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

// Obtener artista por ID
export const getArtistById = (id: number): Artist | undefined => {
  return db.prepare('SELECT * FROM artists WHERE id = ?').get(id) as Artist | undefined;
};

// Actualizar artista
export const updateArtist = (id: number, data: Partial<Artist>): void => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];
  db.prepare(`UPDATE artists SET ${fields} WHERE id = ?`).run(...values);
};

// Eliminar artista
export const deleteArtist = (id: number): void => {
  db.prepare('DELETE FROM artists WHERE id = ?').run(id);
};

// Obtener artistas por usuario
export const getArtistsByUser = (userId: number): Artist[] => {
  return db.prepare('SELECT * FROM artists WHERE user_id = ?').all(userId) as Artist[];
};