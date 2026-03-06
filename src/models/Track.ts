import db from '../config/database';

export interface Track {
  id: number;
  artist_id: number;
  title: string;
  release_date: string | null;
  cover: string | null;
  audio_url: string | null;
  status: string;
  isrc: string | null;
  upc: string | null;
  created_at: string;
}

export const getAllTracks = (): Track[] => {
  return db.prepare('SELECT * FROM tracks').all() as Track[];
};