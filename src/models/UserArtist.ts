import db from '../database';

export interface UserArtist {
  id: number;
  user_id: number;
  artist_id: number;
  role: string;
  created_at: string;
}

// Asignar un usuario a un artista (con rol)
export const assignUserToArtist = (userId: number, artistId: number, role: string = 'manager'): number => {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO user_artists (user_id, artist_id, role)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(userId, artistId, role);
  return result.lastInsertRowid as number;
};

// Obtener artistas de un usuario
export const getArtistsByUser = (userId: number): UserArtist[] => {
  const stmt = db.prepare(`
    SELECT ua.*, a.name as artist_name, a.genre, a.tier
    FROM user_artists ua
    JOIN artists a ON ua.artist_id = a.id
    WHERE ua.user_id = ?
  `);
  return stmt.all(userId) as UserArtist[];
};

// Obtener usuarios (con roles) de un artista
export const getUsersByArtist = (artistId: number): UserArtist[] => {
  const stmt = db.prepare(`
    SELECT ua.*, u.email, u.name as user_name
    FROM user_artists ua
    JOIN users u ON ua.user_id = u.id
    WHERE ua.artist_id = ?
  `);
  return stmt.all(artistId) as UserArtist[];
};

// Eliminar relación
export const removeUserFromArtist = (userId: number, artistId: number): void => {
  db.prepare('DELETE FROM user_artists WHERE user_id = ? AND artist_id = ?').run(userId, artistId);
};

// Verificar si un usuario tiene acceso a un artista (y con qué rol)
export const getUserArtistRole = (userId: number, artistId: number): string | null => {
  const result = db.prepare('SELECT role FROM user_artists WHERE user_id = ? AND artist_id = ?').get(userId, artistId) as { role: string } | undefined;
  return result?.role || null;
};