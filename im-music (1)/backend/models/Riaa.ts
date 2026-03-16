import db from '../config/database';

export interface RiaaCertification {
  id: number;
  artist_id: number;
  type: string;
  threshold: number;
  achieved_at: string;
}

export const createCertification = (artistId: number, type: string, threshold: number) => {
  const stmt = db.prepare(`
    INSERT INTO riaa_certifications (artist_id, type, threshold)
    VALUES (?, ?, ?)
  `);
  return stmt.run(artistId, type, threshold);
};

export const getCertificationsByArtist = (artistId: number): RiaaCertification[] => {
  return db.prepare('SELECT * FROM riaa_certifications WHERE artist_id = ? ORDER BY achieved_at DESC').all(artistId) as RiaaCertification[];
};
