import db from '../config/database';

export interface Artist {
  id: number;
  user_id: number;
  name: string;
  genre: string | null;
  bio: string | null;
  tier: string;
  avatar: string | null;
  spotify_verified: boolean;
  spotify_id: string | null;
  spotify_token: string | null;
  created_at: string;
}

export const createArtist = (userId: number, name: string, genre?: string, bio?: string, avatar?: string) => {
  const stmt = db.prepare(`
    INSERT INTO artists (user_id, name, genre, bio, avatar)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(userId, name, genre, bio, avatar);
};

export const getArtistsByUser = (userId: number): Artist[] => {
  return db.prepare('SELECT * FROM artists WHERE user_id = ?').all(userId) as Artist[];
};

export const getArtistById = (id: number): Artist | undefined => {
  return db.prepare('SELECT * FROM artists WHERE id = ?').get(id) as Artist | undefined;
};

export const updateArtist = (id: number, data: Partial<Artist>) => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  const stmt = db.prepare(`UPDATE artists SET ${fields} WHERE id = ?`);
  return stmt.run(...values, id);
};

export const deleteArtist = (id: number) => {
  return db.prepare('DELETE FROM artists WHERE id = ?').run(id);
};

// Videos
export const getVideosByArtist = (artistId: number) => {
  return db.prepare('SELECT * FROM videos WHERE artist_id = ? ORDER BY created_at DESC').all(artistId);
};

export const createVideo = (artistId: number, title: string, videoUrl: string, platform?: string) => {
  return db.prepare('INSERT INTO videos (artist_id, title, video_url, platform) VALUES (?, ?, ?, ?)').run(
    artistId,
    title,
    videoUrl,
    platform
  );
};

export const deleteVideo = (id: number) => {
  return db.prepare('DELETE FROM videos WHERE id = ?').run(id);
};

// Compositions
export const getCompositionsByArtist = (artistId: number) => {
  return db.prepare('SELECT * FROM compositions WHERE artist_id = ? ORDER BY created_at DESC').all(artistId);
};

export const createComposition = (artistId: number, title: string, iswc?: string, pro?: string, share?: number) => {
  return db.prepare('INSERT INTO compositions (artist_id, title, iswc, pro, share) VALUES (?, ?, ?, ?, ?)').run(
    artistId,
    title,
    iswc,
    pro,
    share
  );
};
