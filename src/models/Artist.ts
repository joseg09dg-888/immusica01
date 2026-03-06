import db from '../config/database';

export interface Artist {
  id: number;
  user_id: number;
  name: string;
  genre: string | null;
  bio: string | null;
  tier: string;
  avatar: string | null;
  created_at: string;
}

export const getArtistsByUser = (userId: number): Artist[] => {
  return db.prepare('SELECT * FROM artists WHERE user_id = ?').all(userId) as Artist[];
};