import db from '../database';

export interface Playlist {
  id: number;
  name: string;
  url: string;
  genre: string | null;
  contact_email: string | null;
  description: string | null;
  submitted_by: number | null;
  verified: number;
  created_at: string;
}

export const getPlaylistById = (id: number): Playlist | undefined => {
  return db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as Playlist | undefined;
};