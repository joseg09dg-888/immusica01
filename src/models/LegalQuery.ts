import db from '../config/database';

export interface LegalQuery {
  id: number;
  artist_id: number;
  pregunta: string;
  respuesta: string;
  created_at: string;
}

export const createLegalQuery = async (artistId: number, pregunta: string, respuesta: string) => {
  return db.prepare(`
    INSERT INTO legal_queries (artist_id, pregunta, respuesta)
    VALUES (?, ?, ?)
  `).run(artistId, pregunta, respuesta);
};

export const getQueriesByArtist = async (artistId: number): Promise<LegalQuery[]> => {
  return db.prepare('SELECT * FROM legal_queries WHERE artist_id = ? ORDER BY created_at DESC').all(artistId) as Promise<LegalQuery[]>;
};
